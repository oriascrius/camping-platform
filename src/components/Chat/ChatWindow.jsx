'use client';
import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useSession } from 'next-auth/react';

const MessageStatus = ({ status }) => {
  switch (status) {
    case 'sent':
      return <span className="text-gray-400">✓</span>;
    case 'delivered':
      return <span className="text-blue-400">✓✓</span>;
    case 'read':
      return <span className="text-blue-500">✓✓</span>;
    default:
      return <span className="text-gray-400">•••</span>;
  }
};

const ChatWindow = () => {
  const { data: session } = useSession();
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isOpen, setIsOpen] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messageEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const [messageStatuses, setMessageStatuses] = useState({});

  // 自動滾動到最新消息
  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const socket = io('http://localhost:3002');

    socket.on('connect', () => {
      console.log('✅ WebSocket 連接成功！');
    });

    socket.on('message', (data) => {
      setMessages(prev => [...prev, data]);
      // 如果是其他人的消息，發送已送達確認
      if (data.userId !== session?.user?.id) {
        socket.emit('messageDelivered', {
          messageId: data.id,
          userId: session?.user?.id
        });
      }
      if (!isOpen) {
        setUnreadCount(prev => prev + 1);
      }
      scrollToBottom();
    });

    // 監聽消息狀態更新
    socket.on('messageStatus', ({ messageId, status, userId }) => {
      if (userId !== session?.user?.id) {
        setMessageStatuses(prev => ({
          ...prev,
          [messageId]: status
        }));
      }
    });

    // 監聽正在輸入事件
    socket.on('userTyping', (data) => {
      if (data.userId !== session?.user?.id) {
        setIsTyping(true);
        scrollToBottom();
      }
    });

    socket.on('userStoppedTyping', (data) => {
      if (data.userId !== session?.user?.id) {
        setIsTyping(false);
      }
    });

    setSocket(socket);

    return () => {
      if (socket) socket.disconnect();
    };
  }, [session]);

  // 當視窗獲得焦點時，標記消息為已讀
  useEffect(() => {
    const handleFocus = () => {
      if (socket && messages.length > 0) {
        const unreadMessages = messages.filter(msg => 
          msg.userId !== session?.user?.id && 
          messageStatuses[msg.id] !== 'read'
        );

        unreadMessages.forEach(msg => {
          socket.emit('messageRead', {
            messageId: msg.id,
            userId: session?.user?.id
          });
        });
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [socket, messages, session, messageStatuses]);

  // 處理輸入事件
  const handleInputChange = (e) => {
    setInputMessage(e.target.value);

    // 發送正在輸入狀態
    if (socket) {
      socket.emit('typing', {
        userId: session?.user?.id,
        username: session?.user?.name
      });

      // 清除之前的計時器
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // 設置新的計時器
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stopTyping', {
          userId: session?.user?.id,
          username: session?.user?.name
        });
      }, 1000);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (socket && inputMessage.trim()) {
      const messageId = Date.now().toString(); // 簡單的 ID 生成
      const messageData = {
        id: messageId,
        text: inputMessage,
        userId: session?.user?.id || 'anonymous',
        username: session?.user?.name || '訪客',
        timestamp: new Date().toISOString()
      };

      socket.emit('message', messageData);
      setMessageStatuses(prev => ({
        ...prev,
        [messageId]: 'sent'
      }));
      setInputMessage('');
      socket.emit('stopTyping', {
        userId: session?.user?.id,
        username: session?.user?.name
      });
    }
  };

  // 打開聊天窗時重置未讀計數
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[500px] bg-white shadow-2xl rounded-2xl flex flex-col overflow-hidden">
      {/* 聊天標題 */}
      <div className="p-4 bg-gradient-to-r from-indigo-600 to-blue-500 text-white flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-400 rounded-full"></div>
          <span className="font-semibold">線上客服</span>
          {!isOpen && unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
        >
          {isOpen ? '−' : '+'}
        </button>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.map((msg) => (
          <div 
            key={msg.id}
            className={`flex ${
              msg.userId === session?.user?.id ? 'justify-end' : 'justify-start'
            }`}
          >
            <div className={`max-w-[80%] ${
              msg.userId === session?.user?.id 
                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white' 
                : 'bg-white border border-gray-200'
            } rounded-2xl px-4 py-2 shadow-sm`}>
              <div className="text-xs opacity-70 mb-1 flex justify-between">
                <span>{msg.username} • {new Date(msg.timestamp).toLocaleTimeString()}</span>
                {msg.userId === session?.user?.id && (
                  <MessageStatus status={messageStatuses[msg.id]} />
                )}
              </div>
              <div className={`${
                msg.userId === session?.user?.id ? 'text-white' : 'text-gray-700'
              }`}>
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex items-center space-x-2 text-gray-500 text-sm">
            <div className="animate-pulse">•••</div>
            <span>對方正在輸入...</span>
          </div>
        )}
        <div ref={messageEndRef} />
      </div>

      {/* 輸入區域 */}
      <form onSubmit={sendMessage} className="p-4 bg-white border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={handleInputChange}
            className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            placeholder="輸入訊息..."
          />
          <button
            type="submit"
            className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-2 rounded-full hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            發送
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow; 