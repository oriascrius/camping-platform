'use client';
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import '@/styles/pages/booking/chat.css';
import { IoSend, IoClose } from "react-icons/io5";
import { v4 as uuidv4 } from 'uuid';

const ChatWindow = ({ socket: initialSocket, onClose, className }) => {
  const { data: session } = useSession();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [isJoined, setIsJoined] = useState(false);
  const [isRoomCreated, setIsRoomCreated] = useState(false);
  const messagesEndRef = useRef(null);

  // 初始化 Socket 和 RoomId
  useEffect(() => {
    if (session?.user && initialSocket && !isJoined) {
      console.log('初始化聊天室...');
      
      // 檢查是否存在聊天室，直接使用用戶ID
      initialSocket.emit('checkRoom', {
        userId: session.user.id
      });

      // 監聽聊天室檢查結果
      initialSocket.on('roomCheck', (response) => {
        console.log('聊天室檢查結果:', response);
        if (response.exists) {
          // 使用資料庫返回的 roomId
          setRoomId(response.roomId);
          setIsRoomCreated(true);
          console.log('使用現有聊天室:', response.roomId);
          
          // 加入聊天室
          initialSocket.emit('joinRoom', {
            roomId: response.roomId,
            userId: session.user.id
          });
        } else {
          // 如果不存在，創建新聊天室，使用 uuidv4
          const newRoomId = uuidv4();
          console.log('創建新聊天室:', newRoomId);
          initialSocket.emit('createRoom', {
            roomId: newRoomId,
            userId: session.user.id
          });
        }
      });

      setSocket(initialSocket);
      setIsJoined(true);
    }
  }, [session, initialSocket, isJoined]);

  // 監聽訊息
  useEffect(() => {
    if (!socket) return;

    // 監聽一般訊息
    socket.on('message', (newMessage) => {
      setMessages(prev => [...prev, newMessage]);
    });

    // 監聽歷史訊息
    socket.on('chatHistory', (history) => {
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

      socket.emit('message', messageData);
      setMessage('');
    } catch (error) {
      console.error('發送訊息錯誤:', error);
    }
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
        <div ref={messagesEndRef} />
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