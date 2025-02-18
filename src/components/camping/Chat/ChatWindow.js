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
      console.log('=== 初始化聊天室開始 ===', {
        userId: session.user.id,
        socketId: initialSocket?.id,
        isJoined,
        currentRoomId: roomId
      });
      
      // 先設置 socket
      setSocket(initialSocket);
      
      // 防止重複初始化的標記
      let isInitializing = false;
      
      // 只在第一次初始化時檢查聊天室
      const handleRoomCheck = (response) => {
        if (isInitializing) return; // 防止重複處理
        isInitializing = true;
        
        console.log('收到 roomCheck 回應:', response);
        if (response.exists) {
          console.log('使用現有聊天室:', response.roomId);
          setRoomId(response.roomId);
          setIsRoomCreated(true);
        } else {
          // 創建新聊天室
          const newRoomId = uuidv4();
          console.log('準備創建新聊天室:', newRoomId);
          
          initialSocket.emit('createRoom', {
            roomId: newRoomId,
            userId: session.user.id
          });
        }
      };

      // 監聽聊天室創建結果
      const handleRoomCreated = (response) => {
        console.log('收到 roomCreated 回應:', response);
        if (response.success) {
          console.log('聊天室創建成功, roomId:', response.roomId);
          setRoomId(response.roomId);
          setIsRoomCreated(true);
        }
      };

      // 監聽聊天歷史
      const handleChatHistory = (history) => {
        console.log('收到聊天歷史:', history?.length || 0, '條訊息');
        setMessages(history || []);
      };

      // 監聽新訊息
      const handleNewMessage = (newMessage) => {
        console.log('收到新訊息:', newMessage);
        setMessages(prev => [...prev, newMessage]);
      };

      // 先移除所有可能的舊監聽器
      initialSocket.removeAllListeners('roomCheck');
      initialSocket.removeAllListeners('roomCreated');
      initialSocket.removeAllListeners('chatHistory');
      initialSocket.removeAllListeners('message');

      // 添加新的監聽器
      initialSocket.on('roomCheck', handleRoomCheck);
      initialSocket.on('roomCreated', handleRoomCreated);
      initialSocket.on('chatHistory', handleChatHistory);
      initialSocket.on('message', handleNewMessage);

      // 發送檢查聊天室事件
      if (!isInitializing) {
        console.log('發送 checkRoom 事件');
        initialSocket.emit('checkRoom', {
          userId: session.user.id
        });
      }

      // 標記已初始化
      setIsJoined(true);

      return () => {
        isInitializing = false;
        console.log('=== 清理聊天室事件監聽器 ===');
        initialSocket.removeAllListeners();
      };
    }
  }, [session?.user?.id, initialSocket]); // 只依賴這兩個值

  // 自動滾動到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 發送訊息
  const handleSendMessage = async (e) => {
    e.preventDefault();
    console.log('準備發送訊息檢查:', {
      hasMessage: !!message.trim(),
      hasSocket: !!initialSocket,
      roomId,
      isRoomCreated
    });

    if (!message.trim() || !initialSocket || !roomId) {
      console.log('發送訊息條件不符合');
      return;
    }

    try {
      console.log('發送訊息:', {
        roomId,
        userId: session.user.id,
        messageLength: message.trim().length
      });

      initialSocket.emit('message', {
        roomId,
        userId: session.user.id,
        message: message.trim(),
        senderType: 'member'
      });

      setMessage('');
    } catch (error) {
      console.error('發送訊息錯誤:', error);
    }
  };

  useEffect(() => {
    console.log('聊天室狀態更新:', {
      roomId,
      isRoomCreated,
      hasSocket: !!initialSocket
    });
  }, [roomId, isRoomCreated, initialSocket]);

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
            placeholder={!roomId ? "聊天室初始化中..." : "輸入訊息..."}
            className="flex-1 py-0 px-3 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#6B8E7B] focus:border-transparent"
            disabled={!roomId || !isRoomCreated}
          />
          <button
            type="submit"
            disabled={!message.trim() || !roomId || !isRoomCreated}
            className="p-2 bg-[#6B8E7B] text-white rounded-full disabled:bg-gray-300 hover:bg-[#5F7A68] transition-colors"
          >
            <IoSend className="w-5 h-5" />
          </button>
        </form>
        {/* 添加狀態顯示，方便除錯 */}
        <div className="text-xs text-gray-500 mt-1">
          {!roomId ? "正在初始化聊天室..." : 
           !isRoomCreated ? "正在建立聊天室連接..." : 
           "聊天室已就緒"}
        </div>
      </div>
    </div>
  );
};

export default ChatWindow; 