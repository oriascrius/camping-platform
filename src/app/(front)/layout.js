"use client";

import { CartSidebar } from "@/components/camping/cart/CartSidebar";
import ChatIcon from "@/components/camping/Chat/ChatIcon";
import { ToastContainer } from "react-toastify";
import { Toaster } from "react-hot-toast";
import "react-toastify/dist/ReactToastify.css";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import UpIcon from "@/components/up-icon/up-icon";
import Loading from "@/components/Loading";
import "bootstrap/dist/css/bootstrap.min.css";

export default function FrontLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [firstLoading, setFirstLoading] = useState(true);

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
    
    // 當 status 不是 loading 時，表示第一次載入完成
    if (status !== "loading") {
      setFirstLoading(false);
    }
  }, [session, status, router]);

  useEffect(() => {
    // 在客戶端動態引入 Bootstrap JS
    require("bootstrap/dist/js/bootstrap.bundle.min.js");
  }, []);

  // 滾動效果
  useEffect(() => {
    const handleScroll = () => {
      const header = document.querySelector("header");
      const header_logo = document.querySelector(".header-logo");
      const up_icon = document.querySelector(".up-icon");

      if (window.scrollY > 0) {
        header?.classList.add("active");
        header_logo?.classList.add("active");
        up_icon?.classList.add("active");
      } else {
        header?.classList.remove("active");
        header_logo?.classList.remove("active");
        up_icon?.classList.remove("active");
      }
    };

    window.addEventListener("scroll", handleScroll);
    // 初始化時執行一次，確保頁面刷新時狀態正確
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // 只在第一次載入時顯示 Loading
  if (firstLoading && status === "loading") {
    return <Loading isLoading={true} />;
  }

  // 未登入用戶或一般用戶都可以看到前台
  return (
    <>
      <Header />
      <div
        style={{
          paddingTop: "150px", // header 高度
          minHeight: "100vh",
        }}
        // 水合警告
        suppressHydrationWarning
      >
        <CartSidebar isOpen={isCartOpen} setIsOpen={setIsCartOpen} />
        {session?.user && !session.user.isAdmin && <ChatIcon />}
        <ToastContainer />
        <Toaster />
        {children}
      </div>
      <Footer />
      <UpIcon />
    </>
  );
}
