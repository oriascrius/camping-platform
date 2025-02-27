'use client';
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { BellIcon } from '@heroicons/react/24/outline';
import { 
  BellIcon as BellIconSolid,
  EnvelopeIcon, 
  ExclamationTriangleIcon,
  XMarkIcon,
  CheckCircleIcon,
  TrashIcon,
  ChevronDownIcon,
  ShoppingBagIcon,
  ShoppingCartIcon, 
  ReceiptRefundIcon, 
  ClipboardDocumentCheckIcon,
  DocumentCheckIcon
} from '@heroicons/react/24/solid';
import { showConfirm, showError } from '@/utils/sweetalert';
import io from 'socket.io-client';
import Swal from 'sweetalert2';
import { motion, AnimatePresence } from 'framer-motion';
import React from 'react';

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
  const [showFilter, setShowFilter] = useState(false);
  const dropdownRef = useRef(null);

  // 初始化 Socket 連接
  useEffect(() => {
    if (session?.user && mounted) {
      const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL;
      
      // 檢查是否為真正的新會話
      const lastLoginTime = localStorage.getItem(`lastLogin_${session.user.id}`);
      const currentTime = new Date().getTime();
      const isNewSession = !lastLoginTime || (currentTime - parseInt(lastLoginTime)) > 30 * 60 * 1000; // 30分鐘過期

      // 如果是新會話，更新最後登入時間
      if (isNewSession) {
        localStorage.setItem(`lastLogin_${session.user.id}`, currentTime.toString());
      }

      const newSocket = io(SOCKET_URL, {
        query: {
          userId: session.user.id,
          userType: session.user.isAdmin ? 'admin' : (session.user.isOwner ? 'owner' : 'member'),
          isNewSession: isNewSession.toString()  // 傳遞實際的會話狀態
        },
        path: '/socket.io/',
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000,
        autoConnect: true
      });

      // 添加連接狀態監聽
      newSocket.on('connect', () => {
        console.log('Socket 連接成功');
        setSocket(newSocket);
        // 連接成功後請求通知列表
        newSocket.emit('getNotifications');
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket 連接錯誤:', error);
        setSocket(null);
      });

      newSocket.on('reconnect', (attemptNumber) => {
        console.log('Socket 重新連接成功，嘗試次數:', attemptNumber);
      });

      newSocket.on('reconnect_error', (error) => {
        console.error('Socket 重新連接失敗:', error);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Socket 斷開連接，原因:', reason);
        setSocket(null);
      });

      newSocket.on('notifications', (data) => {
        try {
          // 確保每個通知都有唯一的 id
          const notificationsWithIds = data.map(notification => ({
            ...notification,
            id: notification.id || `temp-${Date.now()}-${Math.random()}`
          }));
          setNotifications(notificationsWithIds);
          setUnreadCount(notificationsWithIds.filter(n => !n.is_read).length);
        } catch (error) {
          console.error('處理通知數據錯誤:', error);
        }
      });

      newSocket.on('newNotification', (notification) => {
        try {
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
            const typeStyles = getTypeStyles(notification.type);
            
            Swal.fire({
              title: notification.title,
              text: notification.content,
              icon: notification.type === 'alert' ? 'warning' : 'info',
              toast: true,
              position: 'top-end',
              showConfirmButton: false,
              timer: 3000,
              timerProgressBar: true,
              background: 'var(--lightest-brown)',
              color: 'var(--primary-color)',
              iconColor: notification.type === 'alert' 
                ? 'var(--status-warning)'
                : 'var(--status-info)',
              customClass: {
                container: 'pt-[80px]',
                popup: `border-l-4 ${
                  notification.type === 'alert'
                    ? 'border-[var(--status-warning)]'
                    : 'border-[var(--status-info)]'
                }`,
                title: 'font-zh',
                content: 'text-[var(--gray-2)]'
              }
            });
          }

          // 只有訂單通知時才顯示特殊動畫效果
          if (notification.type === 'order') {
            Swal.fire({
              title: notification.title,
              text: notification.content,
              icon: 'success',
              toast: true,
              position: 'top-end',
              showConfirmButton: false,
              timer: 3000,
              timerProgressBar: true,
              background: 'var(--lightest-purple)',
              color: 'var(--primary-color)',
              iconColor: 'var(--status-success)',
              customClass: {
                container: 'pt-[80px]',
                popup: 'border-l-4 border-purple-500 animate-bounce',
                title: 'font-zh',
                content: 'text-[var(--gray-2)]'
              },
              showClass: {
                popup: 'animate__animated animate__fadeInRight animate__faster'
              },
              hideClass: {
                popup: 'animate__animated animate__fadeOutRight animate__faster'
              }
            });
          }
        } catch (error) {
          console.error('處理新通知錯誤:', error);
        }
      });

      // 清理函數
      return () => {
        if (newSocket) {
          console.log('清理 Socket 連接');
          newSocket.off('connect');
          newSocket.off('connect_error');
          newSocket.off('reconnect');
          newSocket.off('reconnect_error');
          newSocket.off('disconnect');
          newSocket.off('notifications');
          newSocket.off('newNotification');
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

  // 添加點擊外部關閉的事件處理
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

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

        if (unreadNotifications.length > 0) {
          // console.log('發送標記已讀請求 - type:', newTab);  // 簡單記錄發送動作

          socket.emit('markTypeAsRead', {
            type: newTab,
            userId: session.user.id,
            notificationIds: unreadNotifications.map(n => n.id)
          });

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

  // 確保這個函數正確計算每種類型的未讀數量
  const getUnreadCountByType = (type) => {
    if (type === 'all') {
      return unreadCount;
    }
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
    const styles = {
      system: {
        label: '系統',
        icon: <BellIconSolid className="h-5 w-5" />,
        bgColor: 'bg-indigo-50',
        textColor: 'text-indigo-600',
        borderColor: 'border-indigo-500',
        hoverBg: 'hover:bg-indigo-50/70',
        iconColor: 'text-indigo-500',
        ringColor: 'ring-indigo-200'
      },
      message: {
        label: '訊息',
        icon: <EnvelopeIcon className="h-5 w-5" />,
        bgColor: 'bg-emerald-50',
        textColor: 'text-emerald-600',
        borderColor: 'border-emerald-500',
        hoverBg: 'hover:bg-emerald-50/70',
        iconColor: 'text-emerald-500',
        ringColor: 'ring-emerald-200'
      },
      alert: {
        label: '提醒',
        icon: <ExclamationTriangleIcon className="h-5 w-5" />,
        bgColor: 'bg-amber-50',
        textColor: 'text-amber-600',
        borderColor: 'border-amber-500',
        hoverBg: 'hover:bg-amber-50/70',
        iconColor: 'text-amber-500',
        ringColor: 'ring-amber-200'
      },
      order: {
        icon: <DocumentCheckIcon className="h-5 w-5" />,
        label: '訂單通知',
        bgColor: 'bg-purple-50',
        textColor: 'text-purple-600',
        borderColor: 'border-purple-500',
        hoverBg: 'hover:bg-purple-50/70',
        iconColor: 'text-purple-500',
        ringColor: 'ring-purple-200'
      }
    };
    return styles[type] || styles.system;
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

  // 在登出時清除 localStorage
  const handleLogout = () => {
    if (session?.user) {
      localStorage.removeItem(`lastLogin_${session.user.id}`);
    }
    // ... 其他登出邏輯 ...
  };

  return (
    <div className="relative" ref={dropdownRef}>
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
      <AnimatePresence>
        {showDropdown && session?.user && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-3 w-full md:w-[500px] bg-white rounded-2xl shadow-2xl  z-50 border border-gray-100
              backdrop-blur-lg bg-white/95"
          >
            <div className="flex flex-col h-[80vh] md:h-[600px]">
              {/* 標題列優化 */}
              <div className="px-3 md:px-5 py-2 border-b border-gray-100 flex justify-between items-center rounded-t-2xl
                bg-gradient-to-r from-indigo-50 to-purple-50">
                <h3 className="text-base md:text-lg font-bold text-gray-800 flex items-center gap-2 m-0">
                  <motion.div
                    animate={{
                      rotate: [0, 15, -15, 0],
                      scale: [1, 1.2, 1.2, 1]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 5
                    }}
                  >
                    <BellIconSolid className="h-5 w-5 text-indigo-500" />
                  </motion.div>
                  <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">
                    通知中心
                  </span>
                </h3>
                <button 
                  onClick={() => setShowDropdown(false)}
                  className="p-1.5 rounded-lg hover:bg-white/50 text-gray-400 hover:text-gray-600 
                    transition-all duration-200 hover:rotate-90 hover:shadow-md"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* 分類標籤優化 */}
              <div className="px-3 md:px-4 py-2 border-b border-gray-100 bg-gradient-to-b from-white to-gray-50/30">
                <div className="hidden md:flex gap-1">
                  {['all', 'system', 'message', 'alert', 'order'].map((tab) => {
                    const isActive = activeTab === tab;
                    const typeUnreadCount = getUnreadCountByType(tab);  // 獲取該類型的未讀數量
                    const styles = tab === 'all' 
                      ? { 
                          label: '全部', 
                          textColor: 'text-gray-800',
                          bgColor: 'bg-gray-100',
                          ringColor: 'ring-gray-300',
                          iconColor: 'text-gray-600',
                          hoverBg: 'hover:bg-gray-200/70',
                          icon: <BellIconSolid className="h-4 w-4" />
                        }
                      : getTypeStyles(tab);
                    
                    return (
                      <motion.button
                        key={tab}
                        onClick={() => handleTabChange(tab)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`py-1.5 px-2.5 rounded-lg text-xs font-medium 
                          transition-all duration-200 
                          flex items-center justify-center gap-1
                          ${isActive 
                            ? `${styles.textColor} ${styles.bgColor} ring-1 ${styles.ringColor} shadow-sm` 
                            : 'text-gray-500 hover:bg-white hover:shadow-sm'
                          }
                          whitespace-nowrap backdrop-blur-sm`}
                      >
                        <motion.div 
                          className={styles.iconColor}
                          animate={isActive ? {
                            rotate: [0, 10, -10, 0],
                            scale: [1, 1.1, 1.1, 1]
                          } : {}}
                          transition={{ duration: 0.5 }}
                        >
                          {React.cloneElement(styles.icon, { className: 'h-4 w-4' })}
                        </motion.div>
                        <span className="truncate">{styles.label}</span>
                        {typeUnreadCount > 0 && (
                          <motion.span 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className={`ml-0.5 px-1.5 py-0.5 
                              ${tab === 'all' 
                                ? 'bg-indigo-500 text-white' 
                                : `${styles.bgColor} ${styles.textColor}`}
                              text-[10px] rounded-full font-medium
                              min-w-[18px] h-[18px] flex items-center justify-center`}
                          >
                            {typeUnreadCount}
                          </motion.span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
              
              {/* 通知列表容器優化 */}
              <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-200 scrollbar-track-transparent rounded-b-2xl
                bg-gradient-to-b from-gray-50/30 to-white">
                <div className="space-y-4 p-3 md:p-4">
                  <AnimatePresence>
                    {filteredNotifications.length > 0 ? (
                      filteredNotifications.map((notification, index) => {
                        const styles = getTypeStyles(notification.type);
                        return (
                          <motion.div
                            key={notification.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2, delay: index * 0.05 }}
                            whileHover={{ scale: 1.02, translateX: 5 }}
                            whileTap={{ scale: 0.98 }}
                            className={`group p-3 rounded-xl cursor-pointer border border-gray-200
                              ${!notification.is_read ? styles.bgColor : 'hover:bg-white'}
                              border-l-4 ${styles.borderColor}
                              hover:shadow-lg transition-all duration-200
                              backdrop-blur-sm`}
                          >
                            <div className="flex items-center gap-3">
                              <motion.div 
                                whileHover={{ rotate: 15 }}
                                className={`flex-shrink-0 ${styles.iconColor}`}
                              >
                                {styles.icon}
                              </motion.div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-2">
                                    <motion.span
                                      layout
                                      className={`text-xs font-medium px-1.5 py-0.5 rounded-md ${styles.bgColor} ${styles.textColor}`}
                                    >
                                      {styles.label}
                                    </motion.span>
                                    {!notification.is_read && (
                                      <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="w-2 h-2 rounded-full bg-blue-500"
                                        style={{ originX: 0.5, originY: 0.5 }}
                                      />
                                    )}
                                  </div>
                                  <span className="text-xs text-gray-400 flex-shrink-0">
                                    {formatDate(notification.created_at)}
                                  </span>
                                </div>
                                <div className="whitespace-pre-wrap">
                                  {notification.content}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="px-5 py-12 text-center"
                      >
                        <motion.div
                          animate={{ 
                            scale: [1, 1.1, 1],
                            rotate: [0, 5, -5, 0],
                            opacity: [0.5, 1, 1, 0.5]
                          }}
                          transition={{ 
                            repeat: Infinity,
                            duration: 3
                          }}
                          className="bg-gradient-to-r from-gray-100 to-gray-50 p-6 rounded-full inline-block"
                        >
                          <BellIcon className="h-12 w-12 text-gray-300" />
                        </motion.div>
                        <p className="text-gray-500 text-sm mt-4 font-medium">
                          暫無{activeTab === 'all' ? '' : getTypeStyles(activeTab).label}通知
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* 底部操作區優化 */}
              {notifications.length > 0 && (
                <div className="px-3 md:px-5 py-3 border-t border-gray-100 flex justify-between items-center
                  bg-gradient-to-b from-gray-50/30 to-white backdrop-blur-sm">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleMarkAllAsRead}
                    className="text-xs md:text-sm text-blue-600 hover:text-blue-700 font-medium 
                      flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-all duration-200"
                  >
                    <CheckCircleIcon className="h-4 w-4" />
                    標記全部已讀
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleClearNotifications}
                    disabled={isClearing}
                    className="flex items-center gap-1 md:gap-2 px-2.5 md:px-3.5 py-1.5 md:py-2 
                      rounded-lg text-xs md:text-sm font-medium text-red-600 hover:text-red-700 
                      hover:bg-red-50 transition-all duration-200 disabled:opacity-50 
                      disabled:cursor-not-allowed hover:shadow-md"
                  >
                    <TrashIcon className="h-4 w-4" />
                    {isClearing ? '清空中...' : '清空通知'}
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}