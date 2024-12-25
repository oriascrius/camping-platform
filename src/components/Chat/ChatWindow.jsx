'use client';
import { useState, useEffect, useRef } from 'react';
import { useSession, signIn } from 'next-auth/react';
import '@/styles/pages/booking/chat.css';

const ChatWindow = ({ socket, onClose }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const { data: session, status } = useSession();
  const [roomId, setRoomId] = useState(null);
  const messagesEndRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasUnread, setHasUnread] = useState(false);
  const [showScrollHint, setShowScrollHint] = useState(false);

  if (status === 'unauthenticated') {
    return (
      <div className="chat-window">
        <div className="chat-header">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">客服聊天室</h3>
            <button onClick={onClose}>✕</button>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center h-full p-4">
          <div className="text-center text-gray-500 mb-4">
            請先登入後再使用聊天功能
          </div>
          <button 
            onClick={() => signIn(undefined, { callbackUrl: window.location.href })}
            className="bg-green-500 text-white px-6 py-2 rounded-full hover:bg-green-600 transition-colors"
          >
            前往登入
          </button>
        </div>
      </div>
    );
  }

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

  const handleTyping = (e) => {
    setMessage(e.target.value);
    socket.emit('typing', { roomId });
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return '';
      
      return new Intl.DateTimeFormat('zh-TW', {
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      console.error('時間格式化錯誤:', error);
      return '';
    }
  };

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollHint(!isNearBottom);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="flex justify-between items-center">
          <div className="user-info">
            <div className="user-avatar">
              {session?.user?.name?.[0] || '訪'}
            </div>
            <div>
              <h3 className="font-semibold">客服聊天室</h3>
              {isTyping && <span className="text-sm">對方正在輸入...</span>}
            </div>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          {hasUnread && <span className="unread-indicator">新</span>}
        </div>
      </div>

      <div className="chat-messages" onScroll={handleScroll}>
        {messages.map((msg, index) => (
          <div key={index} 
               className={`message ${msg.sender_type === 'member' ? 'user' : 'admin'}`}>
            <div className="message-content">
              <span className="message-sender">
                {msg.sender_type === 'member' ? '您' : '客服人員'}
              </span>
              <div className="message-bubble">
                {msg.message}
                <span className="message-time">
                  {formatTime(msg.timestamp)}
                </span>
              </div>
              {msg.sender_type === 'member' && (
                <span className="message-status">
                  {msg.isRead ? '已讀' : '未讀'}
                </span>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="typing-indicator">
            <div className="typing-dots">
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {showScrollHint && (
        <button 
          className="scroll-bottom-hint visible"
          onClick={scrollToBottom}
        >
          ↓ 新訊息
        </button>
      )}

      <div className="chat-input">
        <form onSubmit={handleSendMessage}>
          <input
            type="text"
            value={message}
            onChange={handleTyping}
            placeholder="輸入訊息..."
          />
          <button type="submit" disabled={!message.trim()}>
            <svg className="send-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow; 