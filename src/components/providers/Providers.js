"use client";
import { SessionProvider } from "next-auth/react";

// 全域狀態提供者元件
// 參數 children: 子元件
// 用途: 包裝整個應用，提供身份驗證狀態管理
export const Providers = ({ children }) => {
  return (
    <SessionProvider 
      refetchInterval={0}         // 停用自動重新獲取 session
      refetchOnWindowFocus={false}  // 停用視窗聚焦時重新獲取
    >
      {children}
    </SessionProvider>
  );
};

export default Providers;
