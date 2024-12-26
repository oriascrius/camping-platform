'use client';
import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';

export default function AdminChatModal({ room, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  // 載入聊天記錄
  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // 每5秒更新一次
    return () => clearInterval(interval);
  }, [room.id]);

  // 自動滾動到最新訊息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/admin/chat/${room.id}/messages`);
      const data = await response.json();
      if (response.ok) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('獲取訊息失敗:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const response = await fetch(`/api/admin/chat/${room.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage }),
      });

      if (response.ok) {
        setNewMessage('');
        fetchMessages();
      }
    } catch (error) {
      console.error('發送訊息失敗:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-2xl h-[600px] rounded-lg flex flex-col">
        {/* 聊天室標題 */}
        <div className="p-4 border-b flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">{room.user_name}</h3>
            <p className="text-sm text-gray-500">{room.user_email}</p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* 訊息列表 */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`mb-4 flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[70%] rounded-lg p-3 
                ${msg.sender_type === 'admin' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-800'}`}
              >
                <p>{msg.message}</p>
                <p className="text-xs mt-1 opacity-75">
                  {format(new Date(msg.created_at), 'HH:mm', { locale: zhTW })}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* 訊息輸入框 */}
        <form onSubmit={sendMessage} className="p-4 border-t">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="輸入訊息..."
            />
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              發送
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 