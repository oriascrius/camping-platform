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

  const handleChatClick = async () => {
    try {
      if (session?.user && !socket) {
        const newSocket = io('http://localhost:3002', {
          withCredentials: true
        });
        
        newSocket.on('connect', () => {
          console.log('Socket 連接成功');
          
          newSocket.emit('joinRoom', { 
            userId: session.user.id
          });
        });

        setSocket(newSocket);
      }
      setIsOpen(true);
    } catch (error) {
      console.error('開啟聊天視窗錯誤:', error);
    }
  };

  return (
    <div className="fixed bottom-4 right-4">
      {!isOpen && (
        <button
          onClick={handleChatClick}
          className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-3 shadow-lg"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
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