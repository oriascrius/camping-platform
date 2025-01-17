'use client';
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import '@/styles/pages/booking/chat.css';
import { IoSend, IoClose } from "react-icons/io5";

const ChatWindow = ({ socket: initialSocket, onClose }) => {
  const { data: session } = useSession();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [isJoined, setIsJoined] = useState(false);
  const messagesEndRef = useRef(null);

  // 初始化 Socket 和 RoomId
  useEffect(() => {
    if (session?.user && initialSocket && !isJoined) {
      const userRoomId = `user_${session.user.id}`;
      setRoomId(userRoomId);
      setSocket(initialSocket);
      
      console.log('準備加入房間:', userRoomId);
      initialSocket.emit('joinRoom', {
        userId: session.user.id,
        roomId: userRoomId,
        userType: 'member'
      });
      
      setIsJoined(true);
    }
  }, [session, initialSocket, isJoined]);

  // 監聽訊息
  useEffect(() => {
    if (!socket) return;

    // 監聽一般訊息
    socket.on('message', (newMessage) => {
      console.log('收到新訊息:', newMessage);
      setMessages(prev => [...prev, newMessage]);
    });

    // 監聽歷史訊息
    socket.on('chatHistory', (history) => {
      console.log('收到歷史訊息:', history);
      setMessages(history);
    });

    // 監聽錯誤
    socket.on('error', (error) => {
      console.error('Socket 錯誤:', error);
    });

    return () => {
      socket.off('message');
      socket.off('chatHistory');
      socket.off('error');
    };
  }, [socket]);

  // 自動滾動到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 發送訊息
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !socket || !roomId) return;

    try {
      const messageData = {
        userId: session.user.id,
        message: message.trim(),
        senderType: 'member',
        roomId: roomId
      };

      console.log('發送訊息:', messageData);
      socket.emit('message', messageData);
      setMessage('');
    } catch (error) {
      console.error('發送訊息錯誤:', error);
    }
  };

  return (
    <div className="fixed bottom-20 right-4 w-96 bg-white rounded-lg shadow-xl overflow-hidden transition-all duration-300 ease-in-out">
      {/* 聊天室標題 */}
      <div className="bg-[#6B7A99] text-white p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse opacity-60"></div>
            <h3 className="font-semibold text-lg">客服聊天室</h3>
          </div>
          <button 
            onClick={onClose}
            className="hover:bg-[#7D8BAD] p-2 rounded-full transition-colors"
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
                <div className="w-8 h-8 rounded-full bg-[#6B7A99] flex items-center justify-center text-white relative">
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
                  ? 'bg-[#6B7A99] text-white'
                  : 'bg-white shadow-md text-gray-800'
              }`}
            >
              <p className="break-words">{msg.message}</p>
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
        <div ref={messagesEndRef} />
      </div>

      {/* 輸入區域 */}
      <div className="border-t bg-white p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="輸入訊息..."
            className="flex-1 p-3 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#6B7A99] focus:border-transparent"
          />
          <button
            type="submit"
            disabled={!message.trim()}
            className="p-3 bg-[#6B7A99] text-white rounded-full disabled:bg-gray-300 hover:bg-[#7D8BAD] transition-colors"
          >
            <IoSend className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow; 