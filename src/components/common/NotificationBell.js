'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import socket from '@/lib/socket';
import { BellIcon } from '@heroicons/react/24/outline';
import { showConfirm, showError } from '@/utils/sweetalert';

export default function NotificationBell() {
  const router = useRouter();
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mounted, setMounted] = useState(false);

  // 確保客戶端渲染
  useEffect(() => {
    setMounted(true);
  }, []);

  // 處理點擊鈴鐺
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

    // 已登入則顯示通知下拉選單
    setShowDropdown(!showDropdown);
    if (!showDropdown) {
      fetchNotifications();
      // 點擊時標記所有未讀通知為已讀
      markAllAsRead();
    }
  };

  // WebSocket 連接
  useEffect(() => {
    if (session?.user?.id && mounted) {
      // 加入用戶的通知房間
      socket.emit('joinNotificationRoom', session.user.id);
      
      // 監聽新通知
      socket.on('newNotification', (notification) => {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        // 可以添加通知音效
        new Audio('/notification.mp3').play().catch(() => {});
      });
    }

    return () => {
      socket.off('newNotification');
    };
  }, [session, mounted]);

  // 獲取通知列表
  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (!response.ok) {
        throw new Error('獲取通知失敗');
      }
      const data = await response.json();
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    } catch (error) {
      showError(
        '錯誤',
        '獲取通知失敗，請稍後再試'
      );
    }
  };

  // 標記所有通知為已讀
  const markAllAsRead = async () => {
    if (unreadCount === 0) return;
    
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('標記已讀失敗');
      }

      // 更新本地狀態
      setNotifications(notifications.map(n => ({...n, is_read: true})));
      setUnreadCount(0);
    } catch (error) {
      showError('錯誤', '標記已讀失敗，請稍後再試');
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
      {/* 鈴鐺圖標 - 調整紅色數字位置 */}
      <button 
        onClick={handleBellClick}
        className="relative focus:outline-none"
      >
        <BellIcon className="h-6 w-6 text-gray-600 hover:text-gray-900" />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {/* 美化通知下拉選單 */}
      {showDropdown && session?.user && (
        <div className="absolute right-0 mt-3 w-80 bg-white rounded-lg shadow-xl py-2 z-50 border border-gray-100">
          {/* 標題列 */}
          <div className="px-4 py-2 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">通知</h3>
          </div>
          
          {/* 通知列表 */}
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div 
                  key={notification.id}
                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                >
                  <p className="text-sm text-gray-800 leading-snug">
                    {notification.content}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(notification.created_at)}
                  </p>
                </div>
              ))
            ) : (
              <div className="px-4 py-6 text-sm text-gray-500 text-center">
                <div className="flex flex-col items-center">
                  <BellIcon className="h-8 w-8 text-gray-300 mb-2" />
                  暫無通知
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}