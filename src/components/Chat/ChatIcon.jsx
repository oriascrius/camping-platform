'use client';
import { useState } from 'react';
import ChatWindow from './ChatWindow';

const ChatIcon = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* 聊天視窗 */}
      {isOpen && <ChatWindow onClose={() => setIsOpen(false)} />}

      {/* 聊天圖標 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 w-14 h-14 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity z-50"
      >
        {isOpen ? (
          // 關閉圖標
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          // 聊天圖標
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}

        {/* 未讀消息提示 */}
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
          3
        </span>
      </button>
    </>
  );
};

export default ChatIcon; 