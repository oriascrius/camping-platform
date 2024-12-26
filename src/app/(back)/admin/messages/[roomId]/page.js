'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function ChatRoom() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { roomId } = useParams();

  // 獲取聊天記錄
  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/messages/${roomId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '獲取訊息失敗');
      }
      
      setMessages(data.messages || []);
    } catch (error) {
      console.error('獲取訊息失敗:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 發送訊息
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const response = await fetch('/api/admin/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId,
          message: newMessage,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '發送訊息失敗');
      }

      setNewMessage('');
      fetchMessages(); // 重新獲取訊息
    } catch (error) {
      console.error('發送訊息失敗:', error);
      setError(error.message);
    }
  };

  useEffect(() => {
    fetchMessages();
    // 設定定時更新
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [roomId]);

  if (loading) return <div>載入中...</div>;
  if (error) return <div>錯誤: {error}</div>;

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender_type === 'admin' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[70%] p-3 rounded-lg ${
                message.sender_type === 'admin'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200'
              }`}
            >
              <div className="text-sm font-semibold mb-1">
                {message.sender_name}
              </div>
              <div>{message.message}</div>
              <div className="text-xs text-right mt-1">
                {new Date(message.created_at).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={sendMessage} className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="輸入訊息..."
            className="flex-1 p-2 border rounded"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            發送
          </button>
        </div>
      </form>
    </div>
  );
} 