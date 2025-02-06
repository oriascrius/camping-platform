'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { motion } from 'framer-motion';
import Image from 'next/image';

/**
 * 登出頁面組件
 * 功能：
 * 1. 處理使用者登出流程
 * 2. 顯示登出動畫和提示
 * 3. 自動或手動重定向到首頁
 */
export default function LogoutPage() {
  // 路由控制器，用於頁面導航
  const router = useRouter();
  
  // 登出狀態管理：true = 正在登出，false = 登出完成或失敗
  const [isLoggingOut, setIsLoggingOut] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // 當組件載入時執行登出流程
  useEffect(() => {
    // 登出處理函數
    const handleLogout = async () => {
      try {
        if (isRedirecting) return; // 如果已經在重定向中，就不執行
        
        // 開始登出流程，設置狀態
        setIsLoggingOut(true);
        
        // 執行 NextAuth 登出，移除 callbackUrl
        await signOut({ redirect: false });

        // 延遲 2 秒，讓使用者看到登出動畫
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        setIsRedirecting(true);
        // 先重新整理路由狀態，確保清除認證資訊
        router.refresh();
        // 然後再重定向到首頁
        router.push('/');

      } catch (error) {
        // 登出失敗處理
        console.error('登出錯誤:', error);
        setIsLoggingOut(false);
        setIsRedirecting(false);
      }
    };

    // 執行登出函數
    handleLogout();
  }, [router, isRedirecting]);  // 依賴於 router 的變化

  return (
    // 頁面容器：全屏高度、漸層背景
    <div className="min-h-screen bg-gradient-to-b from-[#F5F1ED] to-white flex flex-col items-center justify-center px-4">
      {/* 內容卡片：使用 Framer Motion 製作動畫效果 */}
      <motion.div
        // 初始狀態：隱藏且下移
        initial={{ opacity: 0, y: 20 }}
        // 動畫狀態：完全顯示在原位
        animate={{ opacity: 1, y: 0 }}
        // 動畫時間：0.5 秒
        transition={{ duration: 0.5 }}
        className="text-center space-y-8"
      >
        {/* Logo 動畫 */}
        <motion.div
          className="relative w-48 h-48 mx-auto"
          animate={{
            opacity: [0.8, 1, 0.8],
            scale: [0.98, 1, 0.98],
            y: [-8, 8, -8],
          }}
          transition={{
            opacity: {
              repeat: Infinity,
              duration: 2,
              ease: "easeInOut"
            },
            scale: {
              repeat: Infinity,
              duration: 2,
              ease: "easeInOut"
            },
            y: {
              repeat: Infinity,
              duration: 2,
              ease: "easeInOut"
            }
          }}
        >
          <Image
            src="/logo-loading.png"
            alt="Logout Logo"
            width={192}
            height={192}
            className="w-full h-full object-contain"
          />
        </motion.div>

        {/* 文字內容區塊 */}
        <motion.div 
          className="space-y-3"
          animate={{ 
            opacity: [0.7, 1, 0.7]
          }}
          transition={{
            opacity: {
              repeat: Infinity,
              duration: 2,
              ease: "easeInOut"
            }
          }}
        >
          <h1 className="text-2xl font-bold text-gray-800">
            {isLoggingOut ? '正在為您登出' : '登出完成'}
          </h1>
          <p className="text-gray-500">
            {isLoggingOut ? '請稍候片刻' : '感謝您的使用，期待再次見到您'}
          </p>
        </motion.div>

        {/* 返回首頁按鈕：只在尚未重定向時顯示 */}
        {!isRedirecting && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            animate={{
              opacity: [0.9, 1, 0.9]
            }}
            transition={{
              opacity: {
                repeat: Infinity,
                duration: 2,
                ease: "easeInOut"
              }
            }}
            onClick={() => {
              setIsRedirecting(true);
              router.refresh();
              router.push('/');
            }}
            className="w-full py-4 px-6 rounded-xl 
                     border-2 border-[#6B8E7B] text-[#6B8E7B]
                     hover:bg-[#6B8E7B] hover:text-white
                     transition-all duration-300
                     flex items-center justify-center gap-2 group"
          >
            <span className="group-hover:translate-x-1 transition-transform duration-200">
              返回首頁
            </span>
          </motion.button>
        )}
      </motion.div>
    </div>
  );
} 