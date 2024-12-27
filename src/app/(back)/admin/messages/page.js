'use client';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import AdminChatModal from '@/components/admin/chat/AdminChatModal';
import io from 'socket.io-client';

export default function AdminMessages() {
  const [chatRooms, setChatRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3002', {
      transports: ['websocket'],
      upgrade: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    newSocket.on('memberMessage', (message) => {
      fetchChatRooms();
    });

    setSocket(newSocket);

    fetchChatRooms();

    return () => newSocket.disconnect();
  }, []);

  const fetchChatRooms = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/messages');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '獲取聊天室失敗');
      }
      
      setChatRooms(data.chatRooms || []);
    } catch (error) {
      console.error('獲取聊天室失敗:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center p-4">載入中...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 p-4">錯誤：{error}</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">客服訊息管理</h1>
      
      {chatRooms.length === 0 ? (
        <div className="text-center text-gray-500 p-4">
          目前沒有任何聊天室
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    會員資訊
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    最後訊息
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    最後更新時間
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    狀態
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    未讀訊息
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {chatRooms.map((room) => (
                  <tr 
                    key={room.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedRoom(room)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {room.user_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {room.user_email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {room.last_message || '尚無訊息'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {room.last_message_time 
                          ? format(new Date(room.last_message_time), 'yyyy/MM/dd HH:mm', { locale: zhTW })
                          : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${room.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {room.status === 'active' ? '進行中' : '已關閉'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {room.unread_count > 0 && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          {room.unread_count}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedRoom && socket && (
        <AdminChatModal
          isOpen={true}
          onClose={() => setSelectedRoom(null)}
          roomId={selectedRoom.id}
          socket={socket}
          room={selectedRoom}
        />
      )}
    </div>
  );
} 