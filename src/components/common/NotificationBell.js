'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { BellIcon } from '@heroicons/react/24/outline';
import { 
  BellIcon as BellIconSolid,
  EnvelopeIcon, 
  ExclamationTriangleIcon,
  XMarkIcon,
  CheckCircleIcon,
  TrashIcon
} from '@heroicons/react/24/solid';
import { showConfirm, showError } from '@/utils/sweetalert';
import io from 'socket.io-client';
import Swal from 'sweetalert2';

export default function NotificationBell() {
  const router = useRouter();
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [socket, setSocket] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [isClearing, setIsClearing] = useState(false);

  // 初始化 Socket 連接
  useEffect(() => {
    if (session?.user && mounted) {
      const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL;
      const newSocket = io(SOCKET_URL, {
        query: {
          userId: session.user.id,
          userType: session.user.isAdmin ? 'admin' : (session.user.isOwner ? 'owner' : 'member')
        },
        transports: ['websocket'],
        upgrade: false
      });

      newSocket.on('connect', () => {
        setSocket(newSocket);
        // 連接成功後請求通知列表
        newSocket.emit('getNotifications');
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket 連接錯誤:', error);
        setSocket(null);
      });

      newSocket.on('notifications', (data) => {
        // 確保每個通知都有唯一的 id
        const notificationsWithIds = data.map(notification => ({
          ...notification,
          id: notification.id || `temp-${Date.now()}-${Math.random()}`
        }));
        setNotifications(notificationsWithIds);
        setUnreadCount(notificationsWithIds.filter(n => !n.is_read).length);
      });

      newSocket.on('newNotification', (notification) => {
        // 確保新通知有唯一的 id
        const notificationWithId = {
          ...notification,
          id: notification.id || `temp-${Date.now()}-${Math.random()}`
        };
        
        // 更新通知列表
        setNotifications(prev => [notificationWithId, ...prev]);
        setUnreadCount(prev => prev + 1);

        // 只有系統通知和重要提醒才會彈出 toast 提示
        if (notification.type === 'system' || notification.type === 'alert') {
          // 獲取該類型通知的樣式設定（顏色、圖標等）
          const typeStyles = getTypeStyles(notification.type);
          
          // 使用 SweetAlert2 顯示通知
          Swal.fire({
            title: notification.title,      // 通知標題
            text: notification.content,     // 通知內容
            // 根據通知類型設定不同圖標：警告或提示
            icon: notification.type === 'alert' ? 'warning' : 'info',
            toast: true,                    // 使用 toast 樣式（較小的通知框）
            position: 'top-end',            // 顯示在右上角
            showConfirmButton: false,       // 不顯示確認按鈕
            timer: 3000,                    // 3秒後自動關閉
            timerProgressBar: true,         // 顯示倒數進度條
            // 使用品牌主色系
            background: 'var(--lightest-brown)',  // 使用最淺的背景色
            color: 'var(--primary-color)',        // 使用主要文字色
            iconColor: notification.type === 'alert' 
              ? 'var(--status-warning)'           // 警告用黃色
              : 'var(--status-info)',             // 一般資訊用藍色
            
            // 自定義樣式類別
            customClass: {
              container: 'pt-[80px]',       // 從頂部增加 80px 的間距
              popup: `border-l-4 ${
                notification.type === 'alert'
                  ? 'border-[var(--status-warning)]'    // 警告用黃色邊框
                  : 'border-[var(--status-info)]'      // 一般資訊用藍色邊框
              }`,
              title: 'font-zh',                        // 使用中文字體
              content: 'text-[var(--gray-2)]'          // 使用次要文字色
            }
          });
        }
      });

      // 清理函數
      return () => {
        if (newSocket) {
          newSocket.off('newNotification');  // 新增：清理新通知監聽器
          newSocket.disconnect();
          setSocket(null);
        }
      };
    }
  }, [session, mounted]);

  // 確保客戶端渲染
  useEffect(() => {
    setMounted(true);
  }, []);

  // 修改：處理點擊鈴鐺
  const handleBellClick = async () => {
    if (!session?.user) {
      const result = await showConfirm(
        '請先登入',
        '登入後即可查看通知內容'
      );

      if (result.isConfirmed) {
        router.push('/auth/login');
      }
      return;
    }

    setShowDropdown(!showDropdown);
  };

  // 修改：處理標籤切換
  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    
    // 只有在有 socket 連接且不是 'all' 標籤時才自動標記已讀
    if (socket && socket.connected && newTab !== 'all') {
      try {
        // 找出該類型的未讀通知
        const unreadNotifications = notifications.filter(
          n => n.type === newTab && !n.is_read
        );

        // 如果有未讀通知，則標記為已讀
        if (unreadNotifications.length > 0) {
          // 發送標記已讀請求
          socket.emit('markTypeAsRead', { type: newTab });

          // 更新本地狀態
          setNotifications(prev => 
            prev.map(n => 
              n.type === newTab ? { ...n, is_read: true } : n
            )
          );

          // 更新未讀數量
          const newUnreadCount = notifications.filter(
            n => !n.is_read && n.type !== newTab
          ).length;
          setUnreadCount(newUnreadCount);
        }
      } catch (error) {
        console.error('標記已讀失敗:', error);
        showError(
          '操作失敗',
          error.message || '標記已讀時發生錯誤'
        );
      }
    }
  };

  // 格式化時間
  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 新增：根據類型過濾通知並計算未讀數量
  const getUnreadCountByType = (type) => {
    return notifications.filter(notification => 
      notification.type === type && !notification.is_read
    ).length;
  };

  // 新增：根據類型過濾通知
  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'all') return true;
    return notification.type === activeTab;
  });

  // 獲取通知類型樣式
  const getTypeStyles = (type) => {
    switch (type) {
      case 'system':
        return {
          label: '系統',
          icon: <BellIconSolid className="h-5 w-5" />,
          bgColor: 'bg-indigo-50',
          textColor: 'text-indigo-600',
          borderColor: 'border-indigo-500',
          hoverBg: 'hover:bg-indigo-50/70',
          iconColor: 'text-indigo-500',
          ringColor: 'ring-indigo-200'
        };
      case 'message':
        return {
          label: '訊息',
          icon: <EnvelopeIcon className="h-5 w-5" />,
          bgColor: 'bg-emerald-50',
          textColor: 'text-emerald-600',
          borderColor: 'border-emerald-500',
          hoverBg: 'hover:bg-emerald-50/70',
          iconColor: 'text-emerald-500',
          ringColor: 'ring-emerald-200'
        };
      case 'alert':
        return {
          label: '提醒',
          icon: <ExclamationTriangleIcon className="h-5 w-5" />,
          bgColor: 'bg-amber-50',
          textColor: 'text-amber-600',
          borderColor: 'border-amber-500',
          hoverBg: 'hover:bg-amber-50/70',
          iconColor: 'text-amber-500',
          ringColor: 'ring-amber-200'
        };
      default:
        return {
          label: '其他',
          icon: <BellIconSolid className="h-5 w-5" />,
          bgColor: 'bg-slate-50',
          textColor: 'text-slate-600',
          borderColor: 'border-slate-300',
          hoverBg: 'hover:bg-slate-50/70',
          iconColor: 'text-slate-500',
          ringColor: 'ring-slate-200'
        };
    }
  };

  // 處理清空通知
  const handleClearNotifications = async () => {
    if (!socket || !socket.connected) {
      console.error('Socket 未連接');
      showError('清空通知失敗', 'Socket 連接已斷開，請重新整理頁面');
      return;
    }

    try {
      const result = await Swal.fire({
        title: '確定要清空所有通知嗎？',
        text: '清空後將無法恢復',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: 'var(--status-error)',
        cancelButtonColor: 'var(--gray-6)',
        confirmButtonText: '確定清空',
        cancelButtonText: '取消'
      });

      if (result.isConfirmed) {
        setIsClearing(true);
        
        // 使用 Promise 包裝 socket 事件
        const clearNotifications = () => new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            socket.off('notificationsCleared'); // 移除監聽器
            reject(new Error('操作超時，請稍後再試'));
          }, 10000); // 增加到 10 秒

          socket.once('notificationsCleared', (response) => {
            clearTimeout(timeout); // 清除超時計時器
            if (response.success) {
              resolve(response);
            } else {
              reject(new Error(response.message));
            }
          });

          // 發送請求
          socket.emit('clearNotifications');
        });

        // 等待清空操作完成
        const response = await clearNotifications();
        
        setIsClearing(false);
        setNotifications([]);
        setUnreadCount(0);
        
        Swal.fire({
          icon: 'success',
          title: '通知已清空',
          timer: 1500,
          showConfirmButton: false
        });

      }
    } catch (error) {
      console.error('清空通知時發生錯誤:', error);
      setIsClearing(false);
      showError('清空通知失敗', error.message);
    }
  };

  // 修改：處理標記全部已讀
  const handleMarkAllAsRead = () => {
    if (!socket || !socket.connected) {
      showError(
        '操作失敗',
        'Socket 連接已斷開，請重新整理頁面'
      );
      return;
    }

    try {
      socket.emit('markAllAsRead', { userId: session.user.id });
      // 立即更新本地狀態
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
      
      // 修改：使用 success 樣式的提醒框
      Swal.fire({
        icon: 'success',
        title: '標記已讀',
        text: '已將所有通知標記為已讀',
        timer: 1500,
        showConfirmButton: false
      });
      
    } catch (error) {
      showError(
        '操作失敗',
        error.message || '標記已讀時發生錯誤'
      );
    }
  };

  // 確保 socket 已連接
  useEffect(() => {
    if (session?.user && mounted) {
      console.log('Socket 狀態:', socket?.connected);
      // ... 其他 socket 初始化代碼 ...
    }
  }, [session, mounted]);

  // 在客戶端渲染前返回 null 或加載狀態
  if (!mounted) {
    return (
      <div className="relative">
        <button className="relative focus:outline-none">
          <BellIcon className="h-6 w-6 text-gray-600" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* 鈴鐺按鈕 */}
      <button 
        onClick={handleBellClick}
        className="relative p-2.5 rounded-xl focus:outline-none group hover:bg-indigo-50 active:bg-indigo-100 transition-all duration-200"
      >
        <BellIcon className="h-6 w-6 text-indigo-600 group-hover:text-indigo-700 group-hover:scale-110 transition-all duration-200" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-medium rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center animate-bounce shadow-lg ring-2 ring-white">
            {unreadCount}
          </span>
        )}
      </button>

      {/* 通知下拉面板 */}
      {showDropdown && session?.user && (
        <div className="absolute right-0 mt-3 w-[720px] bg-white rounded-2xl shadow-2xl py-2 z-50 border border-gray-100 transform transition-all duration-300 ease-out animate-slideIn">
          <div className="flex flex-col h-[600px]"> {/* 固定總高度 */}
            {/* 標題列 */}
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <BellIconSolid className="h-5 w-5 text-indigo-500" />
                通知中心
              </h3>
              <button 
                onClick={() => setShowDropdown(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all duration-200 hover:rotate-90"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* 分類標籤 - 改為水平排列 */}
            <div className="grid grid-cols-4 gap-4 px-5 py-3 border-b border-gray-100">
              {['all', 'system', 'message', 'alert'].map((tab) => {
                const isActive = activeTab === tab;
                const styles = tab === 'all' 
                  ? { label: '全部', textColor: 'text-gray-600' }
                  : getTypeStyles(tab);
                
                const unreadCount = tab === 'all'
                  ? notifications.filter(n => !n.is_read).length
                  : getUnreadCountByType(tab);
                
                return (
                  <button
                    key={tab}
                    onClick={() => handleTabChange(tab)}
                    className={`py-3 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2
                      ${isActive 
                        ? `${styles.textColor} ${styles.bgColor} ring-2 ${styles.ringColor} scale-105 shadow-sm` 
                        : 'text-gray-500 hover:bg-gray-50 hover:scale-105'
                      }
                      flex-1 min-w-[120px]`}
                  >
                    {tab !== 'all' && <div className={styles.iconColor}>{styles.icon}</div>}
                    {styles.label}
                    {unreadCount > 0 && (
                      <span className={`text-xs ${styles.textColor} bg-white/50 px-2 py-0.5 rounded-full`}>
                        {unreadCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            
            {/* 通知列表 - 使用 flex-1 自動佔據剩餘空間 */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
              <div className="grid grid-cols-2 gap-4 p-4"> {/* 改為兩列佈局 */}
                {filteredNotifications.length > 0 ? (
                  filteredNotifications.map((notification) => {
                    const styles = getTypeStyles(notification.type);
                    return (
                      <div 
                        key={notification.id}
                        className={`group p-4 rounded-xl cursor-pointer transition-all duration-200 
                          ${!notification.is_read ? styles.bgColor : 'hover:bg-gray-50'}
                          border-l-4 ${styles.borderColor}
                          hover:scale-[0.99] active:scale-[0.98]
                          shadow-sm hover:shadow-md`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-1 ${styles.iconColor} transform group-hover:rotate-12 transition-transform duration-200`}>
                            {styles.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2">
                              <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${styles.bgColor} ${styles.textColor}`}>
                                {styles.label}
                              </span>
                              <span className="text-xs text-gray-400 whitespace-nowrap">
                                {formatDate(notification.created_at)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-800 mt-1.5 leading-relaxed line-clamp-2 group-hover:line-clamp-none transition-all duration-200">
                              {notification.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-2 px-5 py-10 text-center">
                    <BellIcon className="h-16 w-16 text-gray-300 mx-auto mb-4 animate-pulse" />
                    <p className="text-gray-500">暫無{activeTab === 'all' ? '' : getTypeStyles(activeTab).label}通知</p>
                  </div>
                )}
              </div>
            </div>

            {/* 底部操作區 */}
            {notifications.length > 0 && (
              <div className="px-5 py-3 border-t border-gray-100 flex justify-between items-center bg-white">
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  <CheckCircleIcon className="h-4 w-4" />
                  標記全部已讀
                </button>
                <button 
                  onClick={handleClearNotifications}
                  disabled={isClearing}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <TrashIcon className="h-4 w-4" />
                  {isClearing ? '清空中...' : '清空通知'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}