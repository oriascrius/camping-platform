"use client";

import { CartSidebar } from "@/components/camping/cart/CartSidebar";
import ChatIcon from "@/components/camping/Chat/ChatIcon";
import { ToastContainer } from "react-toastify";
import { Toaster } from "react-hot-toast";
import "react-toastify/dist/ReactToastify.css";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
// 引入 header 和 footer 的 layout
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import 'bootstrap/dist/css/bootstrap.min.css';

export default function FrontLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    // 只有在已登入且是特定角色時才進行導向
    if (status !== "loading" && session?.user) {
      const { isOwner, isAdmin } = session.user;

      if (isOwner) {
        router.replace("/owner");
        return;
      }

      if (isAdmin) {
        router.replace("/admin");
        return;
      }
    }
  }, [session, status, router]);

  useEffect(() => {
    // 在客戶端動態引入 Bootstrap JS
    require('bootstrap/dist/js/bootstrap.bundle.min.js');
  }, []);

  // 如果正在檢查登入狀態，顯示載入中
  if (status === "loading") {
    return <div>Loading...</div>;
  }

  // 未登入用戶或一般用戶都可以看到前台
  return (
    <div className="min-h-screen flex flex-col relative">
      <Header />
      
      <CartSidebar isOpen={isCartOpen} setIsOpen={setIsCartOpen} />

      {/* 添加聊天圖標 - 只有登入用戶才顯示 */}
      {session?.user && !session.user.isAdmin && <ChatIcon />}

      <ToastContainer />
      <Toaster />

      <main className="flex-grow">{children}</main>

      <Footer />
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
