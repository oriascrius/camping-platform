'use client';
import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { showSystemAlert } from '@/utils/sweetalert';
import { useSession } from 'next-auth/react';
import Swal from 'sweetalert2';
import { showNotificationAlert } from '@/utils/sweetalert';
import { notificationToast } from '@/utils/toast';

export default function AdminNotifications() {
  const { data: session, status } = useSession();
  const [socket, setSocket] = useState(null);
  const [users, setUsers] = useState([]);
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notificationTypes, setNotificationTypes] = useState([
    { value: 'system', label: '系統通知' },
    { value: 'message', label: '一般訊息' },
    { value: 'alert', label: '重要提醒' }
  ]);
  const [notification, setNotification] = useState({
    targetRole: 'user',
    type: 'system',
    title: '',
    content: ''
  });
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    console.log('\n=== Socket 初始化 ===');
    const initializeSocket = async () => {
      try {
        if (!session?.user?.id) {
          console.log('等待會話初始化...');
          return;
        }

        console.log('開始初始化 Socket');
        const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
          query: {
            userId: session.user.id,
            userType: 'admin'
          }
        });

        console.log('Socket 連接配置:', {
          url: process.env.NEXT_PUBLIC_SOCKET_URL,
          userId: session.user.id,
          userType: 'admin'
        });

        newSocket.on('connect', () => {
          console.log('✅ Socket 連接成功');
          console.log('Socket ID:', newSocket.id);
          
          // 連接成功後請求用戶列表
          console.log('請求用戶列表...');
          newSocket.emit('requestUsersList');
          newSocket.emit('requestOwnersList');
        });

        newSocket.on('usersList', (data) => {
          console.log('收到會員列表:', data);
          setUsers(data || []);
        });

        newSocket.on('ownersList', (data) => {
          console.log('收到營主列表:', data);
          setOwners(data || []);
        });

        newSocket.on('notificationTypes', (data) => {
          console.log('收到通知類型:', data);
          if (Array.isArray(data) && data.length > 0) {
            setNotificationTypes(data);
          }
        });

        newSocket.on('notificationSent', (response) => {
          console.log('收到發送通知回應:', response);
          setIsSending(false);
          
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
            showSystemAlert.error(
              '發送失敗', 
              `${response.message}\n${response.details?.errors?.map(e => e.error).join('\n') || ''}`
            );
          }
        });

        newSocket.on('error', (error) => {
          console.error('Socket 錯誤:', error);
          showSystemAlert.error('錯誤', error.message || '發生錯誤');
        });

        newSocket.on('connect_error', (error) => {
          console.error('Socket 連接錯誤:', error);
          showSystemAlert.error(
            '連接錯誤',
            '無法連接到伺服器，請檢查網路連接'
          );
        });

        setSocket(newSocket);
        setLoading(false);

      } catch (error) {
        console.error('Socket 初始化失敗:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    initializeSocket();

    return () => {
      if (socket) {
        console.log('清理 Socket 連接');
        socket.disconnect();
      }
    };
  }, [session]);

  // 顯示載入中狀態
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  // 顯示錯誤狀態
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-red-500">
          <p>發生錯誤：{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            重新整理
          </button>
        </div>
      </div>
    );
  }

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
    
    try {
      // 添加內容確認對話框
      const result = await showNotificationAlert.confirmSend({
        title: notification.title,
        content: notification.content,
        targetRole: notification.targetRole === 'all' 
          ? '所有用戶'
          : notification.targetRole === 'user'
          ? '一般會員'
          : '營地主',
        type: notification.type === 'system'
          ? '系統通知'
          : notification.type === 'alert'
          ? '重要提醒'
          : '一般訊息'
      });

      // 如果用戶取消，則不執行發送
      if (!result.isConfirmed) {
        return;
      }

      console.log('\n=== 開始發送通知 ===');
      console.log('當前 Socket 狀態:', {
        已連接: socket?.connected,
        Socket_ID: socket?.id
      });
      console.log('當前用戶資訊:', {
        session,
        userId: session?.user?.id,
        userType: 'admin'
      });
      console.log('通知內容:', notification);
      console.log('可用會員列表:', users);
      console.log('可用營主列表:', owners);
      
      if (!socket?.connected) {
        throw new Error('Socket 未連接，請重新整理頁面');
      }

      // 驗證表單
      if (!notification.title.trim()) {
        throw new Error('請輸入通知標題');
      }
      if (!notification.content.trim()) {
        throw new Error('請輸入通知內容');
      }

      // 獲取目標用戶
      let targetUsers = [];
      console.log('當前選擇的目標角色:', notification.targetRole);

      switch (notification.targetRole) {
        case 'all':
          targetUsers = [...users, ...owners].map(u => u.id);
          break;
        case 'user':
          targetUsers = users.map(u => u.id);
          break;
        case 'owner':
          targetUsers = owners.map(o => o.id);
          break;
      }

      console.log('最終目標用戶列表:', targetUsers);

      if (!targetUsers.length) {
        throw new Error('沒有可發送的目標用戶');
      }

      setIsSending(true);
      console.log('準備發送通知，完整數據:', {
        ...notification,
        targetUsers
      });

      // 監聽發送結果
      socket.once('notificationSent', (response) => {
        console.log('收到發送結果:', response);
        setIsSending(false);
        if (response.success) {
          notificationToast.sendSuccess();
          // 清空表單
          setNotification({
            targetRole: 'user',
            type: 'system',
            title: '',
            content: ''
          });
        } else {
          notificationToast.error('部分發送失敗: ' + response.message);
        }
      });

      // 監聽錯誤
      socket.once('error', (error) => {
        console.error('收到錯誤回應:', error);
        setIsSending(false);
        showSystemAlert.error('發送失敗', error.message);
      });

      // 發送通知
      socket.emit('sendGroupNotification', {
        ...notification,
        targetUsers
      });

    } catch (error) {
      console.error('發送失敗:', error);
      console.error('錯誤詳情:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      notificationToast.error(error.message);
      setIsSending(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">發送系統通知</h1>
        
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
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSending || !socket?.connected}
            >
              {isSending ? '發送中...' : '發送通知'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 