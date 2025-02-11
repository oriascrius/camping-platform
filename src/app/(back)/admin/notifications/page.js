'use client';
import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { showSystemAlert } from '@/utils/sweetalert';
import { useSession } from 'next-auth/react';
import Swal from 'sweetalert2';
import { showNotificationAlert } from '@/utils/sweetalert';
import { notificationToast } from '@/utils/toast';

export default function AdminNotifications() {
  const { data: session, status } = useSession();
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);
  const initializingRef = useRef(false);
  const sessionCheckedRef = useRef(false);
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

  // 新增：監控 session 和 status 的變化
  useEffect(() => {
    // 防止重複檢查
    if (sessionCheckedRef.current) {
      return;
    }

    console.log('\n=== Session 狀態檢查 ===');
    console.log('Session 狀態:', status);
    console.log('Session 數據:', session);
    console.log('用戶 ID:', session?.user?.id);
    console.log('是否為管理員:', session?.user?.isAdmin);

    // 標記已檢查
    sessionCheckedRef.current = true;
  }, [session, status]);

  // Socket 初始化
  useEffect(() => {
    // 防止重複初始化
    if (initializingRef.current) {
      return;
    }

    // 確保 session 已載入且用戶是管理員
    if (status === 'authenticated' && session?.user?.isAdmin) {
      // 從 session 中獲取管理員資訊
      const adminInfo = session.user;
      const userId = `admin_${adminInfo.role}`; // 使用 role 作為 ID
      
      console.log('管理員資訊:', adminInfo);
      console.log('Socket 用戶 ID:', userId);

      // 如果已經有連接且連接正常，直接返回
      if (socketRef.current?.connected) {
        console.log('Socket 已連接且正常');
        return;
      }

      // 標記開始初始化
      initializingRef.current = true;
      console.log('\n=== 開始初始化管理員 Socket ===');

      try {
        // 如果有舊的連接，先斷開
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }

        const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
          query: {
            userId: userId,
            userType: 'admin',
            role: adminInfo.role // 添加角色資訊
          },
          reconnection: false,
          timeout: 10000,
        });

        // 連接成功
        newSocket.on('connect', () => {
          console.log('✅ Socket 連接成功:', newSocket.id);
          initializingRef.current = false;
        });

        // 用戶列表更新
        newSocket.on('usersList', (data) => {
          console.log('收到會員列表');
          setUsers(data || []);
        });

        newSocket.on('ownersList', (data) => {
          console.log('收到營主列表');
          setOwners(data || []);
        });

        // 錯誤處理
        newSocket.on('connect_error', (error) => {
          console.error('Socket 連接錯誤:', error);
          initializingRef.current = false;
        });

        // 保存 socket 實例
        socketRef.current = newSocket;
        setSocket(newSocket);

      } catch (error) {
        console.error('Socket 初始化失敗:', error);
        initializingRef.current = false;
      }
    }

    // 清理函數
    return () => {
      if (socketRef.current) {
        console.log('清理 Socket 連接');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      initializingRef.current = false;
    };
  }, [session, status]);

  // 顯示載入中狀態
  if (status === 'loading') {
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
  if (!session?.user?.isAdmin) {
    return <div className="text-center text-red-500 p-4">無權限訪問</div>;
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
      socket.once('notificationSent', async (response) => {
        setIsSending(false);
        if (response.success) {
          await showNotificationAlert.sendSuccess();
          // 清空表單
          setNotification({
            targetRole: 'user',
            type: 'system',
            title: '',
            content: ''
          });
        } else {
          await showNotificationAlert.sendError(response.message);
        }
      });

      // 監聽錯誤
      socket.once('error', async (error) => {
        console.error('收到錯誤回應:', error);
        setIsSending(false);
        await showNotificationAlert.sendError(error.message);
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