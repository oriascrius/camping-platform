'use client';
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import '@/styles/pages/booking/chat.css';

const ChatWindow = ({ socket, onClose }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const { data: session } = useSession();
  const [roomId, setRoomId] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!socket || !session?.user?.id) return;

    socket.on('roomJoined', (data) => {
      console.log('加入房間成功:', data);
      setRoomId(data.roomId);
    });

    socket.on('message', (newMessage) => {
      setMessages(prev => [...prev, newMessage]);
    });

    socket.on('error', (error) => {
      console.error('聊天錯誤:', error);
      alert(error.message);
    });

    return () => {
      socket.off('roomJoined');
      socket.off('message');
      socket.off('error');
    };
  }, [socket, session]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!message.trim() || !socket || !roomId || !session?.user?.id) return;

    socket.emit('message', {
      roomId: roomId,
      userId: session.user.id,
      message: message.trim()
    });

    setMessage('');
  };

  return (
    <div className="booking-chat-window">
      {/* 聊天室標題 */}
      <div className="booking-chat-header">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold">客服聊天室</h3>
          <button 
            onClick={onClose}
            className="text-white hover:text-gray-200"
          >
            ✕
          </button>
        </div>
      </div>

      {/* 訊息區域 */}
      <div className="booking-chat-messages">
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`message-bubble ${
              msg.sender_type === 'member' ? 'sent' : 'received'
            }`}
          >
            {msg.message}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 輸入區域 */}
      <div className="booking-chat-input">
        <form 
          onSubmit={handleSendMessage}
          className="flex gap-2"
        >
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="輸入訊息..."
            className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
          />
          <button 
            type="submit"
            className="booking-chat-button"
          >
            發送
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow; 