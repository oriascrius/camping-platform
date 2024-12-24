'use client';
import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useSession } from 'next-auth/react';
import { v4 as uuidv4 } from 'uuid';

const ChatWindow = ({ onClose }) => {
  const { data: session } = useSession();
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [roomId, setRoomId] = useState(null);
  const [roomStatus, setRoomStatus] = useState('active');
  const messageEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // 自動滾動到最新消息
  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const newSocket = io('http://localhost:3002');
    
    newSocket.on('connect', () => {
      console.log('✅ Socket 已連接');
      
      // 連接成功後創建或加入聊天室
      if (session?.user?.id) {
        console.log('正在創建聊天室...');
        newSocket.emit('createRoom', { userId: session.user.id });
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket 連接錯誤:', error);
    });

    newSocket.on('roomCreated', ({ roomId }) => {
      console.log('✅ 聊天室已創建:', roomId);
      setRoomId(roomId);
    });

    newSocket.on('message', (message) => {
      console.log('📨 收到新消息:', message);
      setMessages(prev => [...prev, message]);
    });

    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, [session]);

  // 發送消息
  const sendMessage = (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || !socket || !roomId) {
      console.log('無法發送消息:', {
        hasMessage: !!inputMessage.trim(),
        hasSocket: !!socket,
        roomId
      });
      return;
    }

    console.log('正在發送消息...', {
      roomId,
      userId: session?.user?.id,
      message: inputMessage
    });

    socket.emit('message', {
      roomId,
      userId: session?.user?.id,
      message: inputMessage,
      messageType: 'text'
    });

    setInputMessage('');
  };

  // 處理圖片上傳
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      socket.emit('message', {
        roomId,
        userId: session.user.id,
        message: reader.result,
        messageType: 'image'
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed bottom-20 right-4 w-96 h-[500px] bg-white shadow-2xl rounded-2xl flex flex-col overflow-hidden">
      {/* 聊天標題 */}
      <div className="p-4 bg-gradient-to-r from-indigo-600 to-blue-500 text-white flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            socket?.connected ? 'bg-green-400' : 'bg-red-400'
          }`}></div>
          <span className="font-semibold">
            {roomId ? `聊天室 #${roomId.slice(0, 8)}` : '正在連接...'}
          </span>
        </div>
        <button onClick={onClose} className="text-white hover:bg-white/20 rounded-full p-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.map((msg, index) => (
          <div 
            key={index}
            className={`flex ${
              msg.user_id === session?.user?.id ? 'justify-end' : 'justify-start'
            }`}
          >
            <div className={`max-w-[80%] ${
              msg.user_id === session?.user?.id 
                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white' 
                : 'bg-white border border-gray-200'
            } rounded-2xl px-4 py-2 shadow-sm`}
            >
              <div className="break-words">{msg.message}</div>
              <div className="text-xs mt-1 opacity-75">
                {new Date(msg.created_at).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        <div ref={messageEndRef} />
      </div>

      {/* 輸入區域 */}
      <form onSubmit={sendMessage} className="p-4 bg-white border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            placeholder="輸入訊息..."
          />
          <button
            type="submit"
            disabled={!socket?.connected}
            className={`px-6 py-2 rounded-full ${
              socket?.connected 
                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:opacity-90' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            發送
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow; 