import React, { useState } from 'react';

const AdminChatWindow = () => {
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});

  // 處理選擇聊天室
  const handleRoomSelect = async (room) => {
    setActiveRoom(room);
    
    try {
      // 更新訊息為已讀
      await fetch(`/api/messages/read/${room.id}`, {
        method: 'PUT',
      });

      // 更新未讀數
      setUnreadCounts(prev => ({
        ...prev,
        [room.id]: 0
      }));

    } catch (error) {
      console.error('更新已讀狀態失敗:', error);
    }
  };

  return (
    <div className="flex h-full">
      {/* 聊天室列表 */}
      <div className="w-64 border-r">
        {chatRooms.map(room => (
          <div
            key={room.id}
            onClick={() => handleRoomSelect(room)}
            className={`p-4 cursor-pointer hover:bg-gray-100 ${
              activeRoom?.id === room.id ? 'bg-blue-50' : ''
            }`}
          >
            <div className="flex justify-between items-center">
              <span>{room.name}</span>
              {/* 顯示未讀數 */}
              {unreadCounts[room.id] > 0 && (
                <span className="bg-red-500 text-white rounded-full px-2 py-1 text-xs">
                  {unreadCounts[room.id]}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 聊天內容 */}
      <div className="flex-1">
        {activeRoom ? (
          <div className="h-full flex flex-col">
            {/* 聊天訊息 */}
            <div className="flex-1 overflow-y-auto p-4">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`mb-4 flex ${
                    message.sender_type === 'admin' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      message.sender_type === 'admin'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200'
                    }`}
                  >
                    <p>{message.message}</p>
                    <div className="text-xs mt-1 opacity-75">
                      {new Date(message.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 輸入框 */}
            <div className="border-t p-4">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 border rounded-lg px-4 py-2"
                  placeholder="輸入訊息..."
                />
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg"
                >
                  發送
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            請選擇一個聊天室
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminChatWindow; 