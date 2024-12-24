'use client';
import { useState } from 'react';
import ChatWindow from './ChatWindow';

export default function ChatIcon() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        className="fixed bottom-5 right-5 w-14 h-14 bg-blue-500 hover:bg-blue-600 
                   text-white rounded-full shadow-lg flex items-center justify-center 
                   transition-all duration-200 z-[9999]"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="開啟聊天視窗"
      >
        {/* 使用更明顯的聊天圖標 */}
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-8 w-8"
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
      
      {isOpen && <ChatWindow onClose={() => setIsOpen(false)} />}
    </>
  );
} 