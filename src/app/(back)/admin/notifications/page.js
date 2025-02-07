'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function AdminNotifications() {
  const [users, setUsers] = useState([]);
  const [owners, setOwners] = useState([]);
  const [notification, setNotification] = useState({
    targetRole: 'user',  // 'user' 或 'owner'
    type: 'system',
    title: '',
    content: ''
  });

  // 獲取用戶列表
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 並行獲取用戶和營地主數據
        const [usersResponse, ownersResponse] = await Promise.all([
          axios.get('/api/users'),
          axios.get('/api/owners')
        ]);
        
        setUsers(usersResponse.data);
        setOwners(ownersResponse.data);
      } catch (error) {
        console.error('獲取用戶列表失敗:', error);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const targetUsers = notification.targetRole === 'all' 
        ? [...users, ...owners]
        : notification.targetRole === 'user' 
          ? users 
          : owners;

      await axios.post('/api/notifications/send-group-notification', {
        ...notification,
        targetUsers: targetUsers.map(user => user.id)
      });

      alert('通知發送成功！');
      // 清空表單
      setNotification({
        targetRole: 'user',
        type: 'system',
        title: '',
        content: ''
      });
    } catch (error) {
      alert('發送失敗：' + error.message);
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
              >
                <option value="system">系統通知</option>
                <option value="message">訊息通知</option>
                <option value="alert">提醒通知</option>
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
            >
              發送通知
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 