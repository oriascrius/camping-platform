"use client";

import { Inter } from "next/font/google";
import ClientSideNav from "@/components/layout/ClientSideNav";
import { CartSidebar } from "@/components/camping/cart/CartSidebar";
import ChatIcon from '@/components/camping/Chat/ChatIcon';
import { ToastContainer } from "react-toastify";
import { Toaster } from 'react-hot-toast';
import "react-toastify/dist/ReactToastify.css";
import ToastProvider from "@/components/providers/ToastProvider";
import AdminChatModal from "@/components/admin/chat/AdminChatModal";
import { useState } from "react";

const inter = Inter({ subsets: ["latin"] });

export default function FrontLayout({ children }) {
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(null);

  const handleChatOpen = (room) => {
    setCurrentRoom(room);
    setChatModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      <header className="sticky top-0 left-0 right-0 z-50 bg-red-500 shadow-md border-b">
        <div className="h-16 flex items-center justify-between px-4">
          <h1 className="text-xl font-bold">露營探索家</h1>
        </div>
        <ClientSideNav />
      </header>
      
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
      
      <ToastProvider />
      <Toaster position="top-center" />
      <footer className="bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>© 2024 露營探索家. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <div className="fixed bottom-4 right-4 z-50">
        <ChatIcon 
          userId="temp-user-123" 
          onChatOpen={handleChatOpen}
        />
      </div>

      {chatModalOpen && currentRoom && (
        <AdminChatModal
          room={currentRoom}
          onClose={() => setChatModalOpen(false)}
        />
      )}
    </div>
  );
}

// 認證頁面的布局
export function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          露營探索家
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {children}
        </div>
      </div>
    </div>
  );
}