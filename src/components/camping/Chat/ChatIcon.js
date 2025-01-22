'use client';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import ChatWindow from './ChatWindow';
import io from 'socket.io-client';
import '@/styles/pages/booking/chat.css';

const ChatIcon = () => {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [socket, setSocket] = useState(null);

  const handleChatClick = () => {
    if (!session?.user) {
      signIn();
      return;
    }

    if (!socket) {
      // 修改這裡的 Socket.IO 配置
      const SOCKET_URL = process.env.NODE_ENV === 'production'
        ? 'https://camping-platform-production.up.railway.app'  // 確保這是完整的 URL
        : 'http://localhost:3002';

      const newSocket = io(SOCKET_URL, {
        path: '/socket.io/',
        withCredentials: true,
        query: {
          userId: session.user.id,
          userType: 'member',
          roomId: `user_${session.user.id}`
        },
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000
      });

      // 添加連接監聽器
      newSocket.on('connect', () => {
        console.log('Socket 連接成功');
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket 連接錯誤:', error);
      });

      setSocket(newSocket);
    }

    setIsOpen(true);
  };

  return (
    <div className="fixed bottom-4 right-4">
      {!isOpen && (
        <button
          onClick={handleChatClick}
          className="bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-lg transition-all duration-300 hover:scale-110"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-7 w-7"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </button>
      )}

      {isOpen && (
        <ChatWindow
          socket={socket}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default ChatIcon; 