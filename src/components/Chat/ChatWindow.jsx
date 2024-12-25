'use client';
import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const ChatWindow = ({ roomId, userId, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const socket = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleNewMessage = (newMessage) => {
    console.log('處理新消息:', newMessage);
    setMessages(prevMessages => [...prevMessages, newMessage]);
    scrollToBottom();
  };

  useEffect(() => {
    socket.current = io('http://localhost:3002');
    
    if (roomId) {
      socket.current.emit('joinRoom', { roomId, userId });
      socket.current.emit('loadMessages', { roomId });
    }

    socket.current.on('message', handleNewMessage);
    
    socket.current.on('messageHistory', (history) => {
      console.log('收到歷史消息:', history);
      if (Array.isArray(history)) {
        setMessages(history);
        scrollToBottom();
      }
    });

    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, [roomId, userId]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const messageData = {
      roomId,
      userId,
      message: inputMessage,
      messageType: 'text'
    };

    socket.current.emit('message', messageData);
    console.log('發送消息:', messageData);
    
    const localMessage = {
      ...messageData,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      user_id: userId
    };
    handleNewMessage(localMessage);
    
    setInputMessage('');
  };

  return (
    <div className="booking-chat-window">
      <div className="booking-chat-header">
        <h3 className="text-lg font-semibold">客服聊天室</h3>
      </div>

      <div className="booking-chat-messages" style={{ height: '400px', overflowY: 'auto' }}>
        {messages.map((msg, index) => (
          <div
            key={msg.id || index}
            className={`mb-4 flex ${msg.user_id === userId ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg px-4 py-2 ${
                msg.user_id === userId
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <p className="break-words">{msg.message}</p>
              <span className="text-xs opacity-75 block mt-1">
                {new Date(msg.created_at).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="booking-chat-input mt-auto p-4 border-t">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="輸入訊息..."
          />
          <button
            type="submit"
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            發送
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow; 