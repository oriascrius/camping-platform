'use client';
import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { showSystemAlert } from '@/utils/sweetalert';
import { useSession } from 'next-auth/react';
import Swal from 'sweetalert2';

export default function AdminNotifications() {
  const { data: session, status } = useSession();
  const [socket, setSocket] = useState(null);
  const [users, setUsers] = useState([]);
  const [owners, setOwners] = useState([]);
  const [notificationTypes, setNotificationTypes] = useState([]);
  const [notification, setNotification] = useState({
    targetRole: 'user',  // 'user' 或 'owner' 或 'all'
    type: 'system',      // 'system' 或 'message' 或 'alert'
    title: '',
    content: ''
  });
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (status === 'loading' || !session?.user?.isAdmin) {
      return;
    }

    try {
      // 建立 Socket 連接
      const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
        query: {
          userId: session.user.id,
          userType: 'admin'
        }
      });

      // 設置 Socket
      setSocket(newSocket);

      // 監聽事件
      newSocket.on('usersList', (data) => {
        setUsers(data);
      });

      newSocket.on('ownersList', (data) => {
        setOwners(data);
      });

      newSocket.on('notificationTypes', (data) => {
        setNotificationTypes(data);
      });

      newSocket.on('notificationSent', (response) => {
        if (response.success) {
          showSystemAlert.success('通知發送成功');
          // 清空表單
          setNotification({
            targetRole: 'user',
            type: 'system',
            title: '',
            content: ''
          });
        } else {
          showSystemAlert.error('發送失敗', response.message || '通知發送失敗');
        }
      });

      newSocket.on('error', (error) => {
        showSystemAlert.error(
          'Socket 錯誤', 
          error.message || '連接發生錯誤'
        );
      });

      newSocket.on('connect_error', (error) => {
        showSystemAlert.error(
          '連接錯誤',
          '無法連接到伺服器，請檢查網路連接'
        );
      });

      // 請求資料
      newSocket.emit('getUsers');
      newSocket.emit('getOwners');
      newSocket.emit('getNotificationTypes');

      // 清理
      return () => {
        try {
          newSocket.off('usersList');
          newSocket.off('ownersList');
          newSocket.off('notificationTypes');
          newSocket.off('notificationSent');
          newSocket.off('error');
          newSocket.off('connect_error');
          newSocket.disconnect();
        } catch (error) {
          showSystemAlert.error(
            '斷開連接錯誤',
            '斷開 Socket 連接時發生錯誤'
          );
        }
      };
    } catch (error) {
      showSystemAlert.error(
        '初始化錯誤',
        '建立 Socket 連接時發生錯誤'
      );
    }
  }, [session, status]);

  // 權限檢查
  if (status === 'loading') {
    return <div className="text-center p-4">驗證中...</div>;
  }

  if (!session) {
    return <div className="text-center text-red-500 p-4">請先登入</div>;
  }

  if (!session?.user?.isAdmin) {
    return <div className="text-center text-red-500 p-4">權限不足</div>;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!socket) {
      showSystemAlert.error(
        '連接錯誤',
        '未建立 Socket 連接，請重新整理頁面'
      );
      return;
    }

    try {
      // 準備顯示的目標用戶資訊
      let targetInfo = '';
      if (notification.targetRole === 'all') {
        targetInfo = '所有會員和營地主';
      } else if (notification.targetRole === 'user') {
        targetInfo = '所有一般會員';
      } else if (notification.targetRole === 'owner') {
        targetInfo = '所有營地主';
      }

      // 通知類型說明
      let typeInfo = '';
      switch(notification.type) {
        case 'system':
          typeInfo = '系統通知';
          break;
        case 'message':
          typeInfo = '一般訊息';
          break;
        case 'alert':
          typeInfo = '重要提醒';
          break;
      }

      // 跳出確認提示
      const result = await Swal.fire({
        title: '確定要發送通知嗎？',
        html: `
          <div class="text-left">
            <p class="mb-2"><strong>發送對象：</strong>${targetInfo}</p>
            <p class="mb-2"><strong>通知類型：</strong>${typeInfo}</p>
            <p class="mb-2"><strong>通知標題：</strong>${notification.title}</p>
            <p class="mb-2"><strong>通知內容：</strong></p>
            <p class="text-gray-600 bg-gray-50 p-2 rounded">${notification.content}</p>
          </div>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: 'var(--secondary-1)',
        cancelButtonColor: 'var(--gray-6)',
        confirmButtonText: '確定發送',
        cancelButtonText: '取消',
        width: '600px'
      });

      // 如果用戶點擊取消，則直接返回
      if (!result.isConfirmed) {
        return;
      }

      setIsSending(true);

      // 根據目標角色選擇接收者
      let targetUsers = [];
      if (notification.targetRole === 'all') {
        targetUsers = [...users, ...owners].map(user => user.id);
      } else if (notification.targetRole === 'user') {
        targetUsers = users.map(user => user.id);
      } else if (notification.targetRole === 'owner') {
        targetUsers = owners.map(owner => owner.id);
      }

      // 檢查是否有目標用戶
      if (targetUsers.length === 0) {
        showSystemAlert.error('發送失敗', '沒有符合條件的接收者');
        return;
      }

      // 發送通知
      socket.emit('sendGroupNotification', {
        ...notification,
        targetUsers
      });

    } catch (error) {
      showSystemAlert.error(
        '發送失敗', 
        error.message || '發送通知時發生錯誤'
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-8 pb-4 border-b">
          發送系統通知
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 發送對象 */}
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                發送對象
              </label>
              <select
                value={notification.targetRole}
                onChange={(e) => setNotification({...notification, targetRole: e.target.value})}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                required
              >
                <option value="user">一般會員</option>
                <option value="owner">營地主</option>
                <option value="all">所有用戶</option>
              </select>
            </div>
            
            {/* 通知類型 */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                通知類型
              </label>
              <select
                value={notification.type}
                onChange={(e) => setNotification({...notification, type: e.target.value})}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                required
              >
                {notificationTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* 標題 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              通知標題
            </label>
            <input
              type="text"
              value={notification.title}
              onChange={(e) => setNotification({...notification, title: e.target.value})}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="請輸入通知標題"
              required
            />
          </div>
          
          {/* 內容 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              通知內容
            </label>
            <textarea
              value={notification.content}
              onChange={(e) => setNotification({...notification, content: e.target.value})}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors h-40 resize-none"
              placeholder="請輸入通知內容"
              required
            />
          </div>
          
          {/* 送出按鈕 */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              disabled={isSending}
            >
              發送通知
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 