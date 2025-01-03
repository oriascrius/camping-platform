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
import { useState, useEffect } from "react";
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const inter = Inter({ subsets: ["latin"] });

export default function FrontLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // 只有在已登入且是特定角色時才進行導向
    if (status !== 'loading' && session?.user) {
      const { isOwner, isAdmin } = session.user;
      
      if (isOwner) {
        router.replace('/owner');
        return;
      }
      
      if (isAdmin) {
        router.replace('/admin');
        return;
      }
    }
  }, [session, status, router]);

  // 如果正在檢查登入狀態，顯示載入中
  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  // 未登入用戶或一般用戶都可以看到前台
  return (
    <div className="min-h-screen flex flex-col relative">
      <header className="sticky top-0 left-0 right-0 z-50 bg-red-500 shadow-md border-b">
        <div className="h-16 flex items-center justify-between px-4">
          <h1 className="text-xl font-bold">露營探索家</h1>
        </div>
        <ClientSideNav />
      </header>
      
      <main className="flex-grow">
        {children}
      </main>
      
      <footer className="bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <p className="text-center text-gray-600">
            © 2024 露營探索家. All rights reserved.
          </p>
        </div>
      </footer>
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