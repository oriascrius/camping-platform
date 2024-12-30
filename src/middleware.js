import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

// withAuth 是 NextAuth.js 提供的高階函數，用於保護路由
export default withAuth(
  // middleware 函數在每個匹配的路由請求之前執行
  async function middleware(req) {
    // 從 NextAuth 獲取當前用戶的 token
    const token = req.nextauth.token;
    // 檢查當前請求的路徑是否以 /admin 開頭
    const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');
    
    // 處理管理員路由的訪問控制
    if (isAdminRoute) {
      // 如果是管理員路由，但用戶不是管理員
      if (!token?.isAdmin) {
        // 如果用戶已登入但不是管理員，重定向到首頁
        if (token) {
          return NextResponse.redirect(new URL('/', req.url));
        }
        // 如果用戶未登入，重定向到登入頁面
        return NextResponse.redirect(new URL('/auth/login', req.url));
      }
    }

    // 允許請求繼續，並設置響應頭
    return NextResponse.next({
      headers: {
        // 禁用瀏覽器緩存
        'Cache-Control': 'no-store, must-revalidate',
        'Pragma': 'no-cache',
      }
    });
  },
  {
    // 配置授權檢查邏輯
    callbacks: {
      authorized: ({ token, req }) => {
        const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');
        // 管理員路由需要管理員權限
        if (isAdminRoute) {
          return token?.isAdmin === true;
        }
        // 其他受保護路由只需要用戶登入
        return !!token;
      }
    },
    // 設置登入頁面路徑
    pages: {
      signIn: '/auth/login',
    }
  }
);

// 修正 matcher 配置
export const config = {
  matcher: [
    // 管理員路由
    '/admin/:path*',      
    
    // 需要登入的功能路由
    '/camping/profile/:path*',  //保護個人資料頁面
    '/camping/checkout/:path*', //保護結帳頁面
    '/camping/cart/:path*',     //保護購物車頁面
    '/camping/chat/:path*',     //保護聊天頁面
    '/camping/favorites/:path*' //保護收藏頁面
  ]
};
