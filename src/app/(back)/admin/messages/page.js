'use client';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import AdminChatModal from '@/components/admin/chat/AdminChatModal';
import io from 'socket.io-client';
import { useSession } from 'next-auth/react';
import { showSystemAlert } from '@/utils/sweetalert';

export default function AdminMessages() {
  const { data: session, status } = useSession();
  const [chatRooms, setChatRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [socket, setSocket] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    ('Session 狀態:', status);
    ('Session 資料:', session);
    ('是否為管理員:', session?.user?.isAdmin);
  }, [session, status]);

  useEffect(() => {
    if (status === 'loading' || !session?.user?.isAdmin) {
      return;
    }

    try {
      const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3002', {
        query: {
          userId: session.user.id,
          userType: 'admin'
        }
      });

      newSocket.on('connect', () => {
        setSocket(newSocket);
        newSocket.emit('getChatRooms');
      });

      newSocket.on('chatRooms', (data) => {
        setChatRooms(Array.isArray(data) ? data : []);
        setLoading(false);
      });

      newSocket.on('message', (messageData) => {
        setChatRooms(prevRooms => {
          return prevRooms.map(room => {
            if (room.id === messageData.room_id) {
              return {
                ...room,
                last_message: messageData.message,
                last_message_time: messageData.created_at,
                unread_count: messageData.sender_type === 'member' 
                  ? (room.unread_count || 0) + 1 
                  : room.unread_count
              };
            }
            return room;
          });
        });
        newSocket.emit('getChatRooms');
      });

      newSocket.on('messagesRead', ({ roomId }) => {
        setChatRooms(prevRooms => {
          return prevRooms.map(room => {
            if (room.id === roomId) {
              return {
                ...room,
                unread_count: 0
              };
            }
            return room;
          });
        });
        newSocket.emit('getChatRooms');
      });

      newSocket.on('updateChatRooms', () => {
        newSocket.emit('getChatRooms');
      });

      newSocket.on('error', (error) => {
        showSystemAlert.error(
          'Socket 錯誤',
          error.message || '連接發生錯誤'
        );
        setError(error.message || '連接錯誤');
        setLoading(false);
      });

      return () => {
        if (newSocket) {
          newSocket.off('chatRooms');
          newSocket.off('message');
          newSocket.off('messagesRead');
          newSocket.off('updateChatRooms');
          newSocket.disconnect();
        }
      };
    } catch (error) {
      showSystemAlert.error(
        '連接錯誤',
        '建立 Socket 連接時發生錯誤'
      );
    }
  }, [session, status]);

  const handleRoomSelect = (room) => {
    try {
      setSelectedRoom(room);
      
      if (socket && room.unread_count > 0) {
        socket.emit('markMessagesAsRead', { 
          roomId: room.id,
          userId: session.user.id 
        });
        
        setChatRooms(prevRooms => 
          prevRooms.map(r => 
            r.id === room.id 
              ? { ...r, unread_count: 0 }
              : r
          )
        );
      }
    } catch (error) {
      showSystemAlert.error(
        '操作錯誤',
        '選擇聊天室時發生錯誤'
      );
      setError('選擇聊天室時發生錯誤');
    }
  };

  const fetchChatRooms = () => {
    if (socket) {
      setLoading(true);
      socket.emit('getChatRooms');
    }
  };

  const clearUnreadCount = (roomId) => {
    socket.emit('markMessagesAsRead', { roomId });
  };

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    setRetryCount(0);
  };

  if (status === 'loading') {
    ('渲染: 驗證中...');
    return <div className="text-center p-4">驗證中...</div>;
  }

  if (!session) {
    ('渲染: 請先登入');
    return <div className="text-center text-red-500 p-4">請先登入</div>;
  }

  if (!session?.user?.isAdmin) {
    ('渲染: 權限不足');
    return <div className="text-center text-red-500 p-4">權限不足</div>;
  }

  if (loading) {
    ('渲染: 載入中...');
    return <div className="text-center p-4">載入中...</div>;
  }

  if (error) {
    ('渲染: 錯誤 -', error);
    return (
      <div className="text-center p-4">
        <div className="text-red-500 mb-4">錯誤：{error}</div>
        <button 
          onClick={handleRetry}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          重試連接
        </button>
      </div>
    );
  }

  ('渲染: 聊天室列表');
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
                    className={`
                      hover:bg-gray-50 cursor-pointer
                      ${room.unread_count > 0 ? 'font-semibold bg-blue-50' : ''}
                    `}
                    onClick={() => handleRoomSelect(room)}
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
                      <div className={`
                        inline-flex items-center justify-center 
                        ${room.unread_count > 0 
                          ? 'bg-red-500 text-white' 
                          : 'bg-gray-200 text-gray-600'} 
                        rounded-full w-6 h-6 text-sm
                      `}>
                        {room.unread_count || 0}
                      </div>
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
          onClose={() => {
            setSelectedRoom(null);
            socket.emit('getChatRooms');
          }}
          roomId={selectedRoom.id}
          socket={socket}
          room={selectedRoom}
          adminId={session?.user?.id}
          onError={(error) => {
            showSystemAlert.error(
              '聊天視窗錯誤',
              error.message || '聊天視窗發生錯誤'
            );
            setError(error.message || '聊天視窗發生錯誤');
            setSelectedRoom(null);
          }}
        />
      )}
    </div>
  );
}