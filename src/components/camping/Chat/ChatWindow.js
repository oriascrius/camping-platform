'use client';
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import '@/styles/pages/booking/chat.css';
import { IoSend, IoClose } from "react-icons/io5";

const ChatWindow = ({ socket, onClose, className }) => {
  const { data: session } = useSession();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const messagesEndRef = useRef(null);

  // 生成唯一的聊天室ID
  const roomId = session?.user?.id 
    ? `chat_${session.user.id}` 
    : null;

  // 添加滾動到底部的函數
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'end'
    });
  };

  // 監聽訊息變化，自動滾動
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 初始化聊天和訊息監聽
  useEffect(() => {
    if (!socket || !session?.user) return;

    // 初始化聊天室
    socket.emit('initializeChat', { 
      roomId,
      userId: session.user.id 
    });

    // 監聽初始化完成
    socket.on('chatInitialized', (data) => {
      if (data.success) {
        setIsInitialized(true);
        socket.emit('joinRoom', { roomId });
      }
    });

    // 監聽聊天歷史
    socket.on('chatHistory', (history) => {
      setMessages(history);
      scrollToBottom();  // 載入歷史訊息後滾動
    });

    // 監聽新訊息
    socket.on('message', (newMessage) => {
      setMessages(prev => [...prev, newMessage]);
      scrollToBottom();  // 收到新訊息後滾動
    });

    // 監聽錯誤
    socket.on('error', (error) => {
      console.error('聊天錯誤:', error);
    });

    // 清理函數
    return () => {
      socket.off('chatInitialized');
      socket.off('chatHistory');
      socket.off('message');
      socket.off('error');
    };
  }, [socket, session]);

  // 發送訊息
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() || !socket || !session?.user) return;

    socket.emit('message', {
      roomId: roomId,
      userId: session.user.id,
      message: message.trim(),
      senderType: 'member'
    });

    setMessage('');
    scrollToBottom();  // 發送訊息後滾動
  };

  return (
    <div className={`
      bg-white 
      rounded-lg 
      shadow-lg 
      overflow-hidden
      border border-gray-200
      ${className}
    `}>
      {/* 聊天室標題 - 改用主色 */}
      <div className="bg-[#6B8E7B] text-white p-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse opacity-60"></div>
            <h3 className="font-semibold text-lg m-0">客服聊天室</h3>
          </div>
          <button 
            onClick={onClose}
            className="hover:bg-[#5F7A68] p-2 rounded-full transition-colors"
          >
            <IoClose className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 聊天內容區域 */}
      <div className="h-[400px] overflow-y-auto p-4 bg-[#F6F8FB]">
        {messages.map((msg, index) => (
          <div
            key={msg.id || index}
            className={`mb-4 flex ${
              msg.sender_type === 'member' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.sender_type !== 'member' && (
              <div className="flex flex-col items-center mr-2">
                <div className="w-8 h-8 rounded-full bg-[#6B8E7B] flex items-center justify-center text-white relative">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                </div>
                <span className="text-xs text-gray-500 mt-1">客服人員</span>
              </div>
            )}
            <div
              className={`max-w-[70%] rounded-2xl p-3 ${
                msg.sender_type === 'member'
                  ? 'bg-[#6B8E7B] text-white'
                  : 'bg-white shadow-md text-gray-800'
              }`}
            >
              <p className="break-words mb-1">{msg.message}</p>
              <div className={`text-xs mt-1 ${
                msg.sender_type === 'member' ? 'text-[#E8ECF2]' : 'text-gray-500'
              }`}>
                {format(
                  new Date(msg.created_at || msg.timestamp),
                  'yyyy/MM/dd HH:mm',
                  { locale: zhTW }
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} style={{ height: '1px' }} />
      </div>

      {/* 輸入區域 */}
      <div className="border-t bg-white p-2">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="輸入訊息..."
            className="flex-1 py-0 px-3 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#6B8E7B] focus:border-transparent"
          />
          <button
            type="submit"
            disabled={!message.trim()}
            className="p-2 bg-[#6B8E7B] text-white rounded-full disabled:bg-gray-300 hover:bg-[#5F7A68] transition-colors"
          >
            <IoSend className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow; 