"use client";
import { SessionProvider } from "next-auth/react";

// 讓任何子元件都能使用 useSession() 鉤子來獲取用戶資訊
// 全域狀態提供者元件
// 用途:
// 1. 提供 NextAuth 的 Session 管理功能
// 2. 讓所有子元件都能存取登入狀態
// 3. 管理身份驗證的自動更新行為
export const Providers = ({ children }) => {
  return (
    <SessionProvider
      refetchInterval={0} // 停用自動重新獲取 session，避免不必要的請求
      refetchOnWindowFocus={false} // 停用視窗聚焦時重新獲取，提升效能
    >
      {children}
    </SessionProvider>
  );
};

export default Providers;
