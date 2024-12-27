'use client';
import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';

export default function AdminChatModal({ isOpen, onClose, roomId, socket, room }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  // 監聽新訊息
  useEffect(() => {
    if (!socket) return;

    // 加入聊天室
    socket.emit('joinRoom', {
      roomId: roomId,
      userType: 'admin'
    });

    // 監聽一般訊息
    const handleNewMessage = (message) => {
      console.log('聊天室收到新訊息:', message);
      if (message.roomId === roomId) {
        setMessages(prev => [...prev, message]);
      }
    };

    // 監聽用戶訊息
    const handleUserMessage = (message) => {
      console.log('聊天室收到用戶訊息:', message);
      if (message.roomId === roomId) {
        setMessages(prev => [...prev, message]);
      }
    };

    // 監聽歷史訊息
    const handleChatHistory = (history) => {
      console.log('收到歷史訊息:', history);
      setMessages(history);
    };

    socket.on('message', handleNewMessage);
    socket.on('newUserMessage', handleUserMessage);
    socket.on('chatHistory', handleChatHistory);

    return () => {
      socket.off('message', handleNewMessage);
      socket.off('newUserMessage', handleUserMessage);
      socket.off('chatHistory', handleChatHistory);
    };
  }, [socket, roomId]);

  // 自動滾動到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 發送訊息
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;

    const messageData = {
      roomId: roomId,
      message: newMessage.trim(),
      senderType: 'admin',
      userId: room.admin_id
    };

    socket.emit('message', messageData);
    setNewMessage('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-md rounded-lg shadow-lg">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">客服聊天室</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>
        </div>

        <div className="h-96 overflow-y-auto p-4">
          {messages.map((msg) => {
            console.log('訊息物件:', msg);
            return (
              <div key={msg.id} 
                   className={`flex ${(msg.sender_type === 'admin' || msg.senderType === 'admin') ? 'justify-end' : 'justify-start'} mb-4`}>
                <div className={`max-w-[70%] ${
                  (msg.sender_type === 'admin' || msg.senderType === 'admin')
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200'
                } rounded-lg px-4 py-2`}>
                  <div>{msg.message}</div>
                  <div className="text-xs text-right mt-1">
                    {(msg.created_at || msg.timestamp) && format(
                      new Date(msg.created_at || msg.timestamp),
                      'yyyy/MM/dd HH:mm',
                      { locale: zhTW }
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="p-4 border-t">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 border rounded-lg px-3 py-2"
              placeholder="輸入訊息..."
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || !socket}
              className={`px-4 py-2 rounded-lg ${
                newMessage.trim() && socket
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              發送
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 