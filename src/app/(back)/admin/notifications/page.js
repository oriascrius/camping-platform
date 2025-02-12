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
    if (status === 'authenticated' && session?.user?.isAdmin) {
      try {
        const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3002';
        console.log('\n=== Socket 初始化 ===');
        
        // 處理 admin ID 格式
        const adminId = session.user.id.replace('admin_', '');
        console.log('處理後的管理員 ID:', adminId);

        const newSocket = io(SOCKET_URL, {
          query: {
            userId: adminId,
            userType: 'admin',
            role: 'admin'
          }
        });

        newSocket.on('connect', () => {
          console.log('✅ Socket 連接成功');
          // 立即請求用戶列表
          newSocket.emit('getAllUsers');
          newSocket.emit('getAllOwners');
        });

        // 用戶列表更新 - 添加更多日誌
        newSocket.on('usersList', (data) => {
          console.log('收到會員列表原始數據:', data);
          if (!Array.isArray(data)) {
            console.error('會員列表格式錯誤:', data);
            return;
          }
          console.log('收到會員列表:', data?.length || 0, '位會員');
          setUsers(data || []);
        });

        newSocket.on('ownersList', (data) => {
          console.log('收到營主列表原始數據:', data);
          if (!Array.isArray(data)) {
            console.error('營主列表格式錯誤:', data);
            return;
          }
          console.log('收到營主列表:', data?.length || 0, '位營主');
          setOwners(data || []);
        });

        // 添加錯誤處理
        newSocket.on('connect_error', (error) => {
          console.error('Socket 連接錯誤:', error);
          setError('Socket 連接失敗');
        });

        newSocket.on('error', (error) => {
          console.error('Socket 錯誤:', error);
          setError('接收數據時發生錯誤');
        });

        socketRef.current = newSocket;
        setSocket(newSocket);

        // 清理函數
        return () => {
          if (newSocket) {
            newSocket.off('usersList');
            newSocket.off('ownersList');
            newSocket.off('connect_error');
            newSocket.off('error');
            newSocket.close();
          }
        };

      } catch (error) {
        console.error('Socket 初始化失敗:', error);
        setError('Socket 初始化失敗');
      }
    }
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

      if (!result.isConfirmed) {
        return;
      }

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

      setIsSending(true);

      // 直接發送符合 notifyHandler.js 的資料格式
      socket.emit('sendGroupNotification', {
        type: notification.type,
        title: notification.title,
        content: notification.content,
        targetRole: notification.targetRole // 'all', 'user', 或 'owner'
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
          await showNotificationAlert.sendError(
            `發送結果: 成功 ${response.details.successCount}, 失敗 ${response.details.failureCount}`
          );
        }
      });

      socket.once('error', async (error) => {
        console.error('收到錯誤回應:', error);
        setIsSending(false);
        await showNotificationAlert.sendError(error.message);
      });

    } catch (error) {
      console.error('發送失敗:', error);
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