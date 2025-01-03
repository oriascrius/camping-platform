import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

// withAuth 是 NextAuth.js 提供的高階函數，用於保護路由
export default withAuth(
  // middleware 函數在每個匹配的路由請求之前執行
  async function middleware(req) {
    // 從 NextAuth 獲取當前用戶的 token
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    
    // 檢查路由類型
    const isAdminRoute = path.startsWith('/admin');
    const isOwnerRoute = path.startsWith('/owner');

    // 處理管理員路由
    if (isAdminRoute && !token?.isAdmin) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    // 處理營主路由
    if (isOwnerRoute && !token?.isOwner) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    return NextResponse.next();
  },
  {
    // 配置授權檢查邏輯
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        
        // 管理員路由檢查
        if (path.startsWith('/admin')) {
          return token?.isAdmin === true;
        }
        
        // 營主路由檢查
        if (path.startsWith('/owner')) {
          return token?.isOwner === true;
        }
        
        // 需要登入的功能路由
        if (
          path.startsWith('/camping/profile') ||
          path.startsWith('/camping/checkout') ||
          path.startsWith('/camping/cart') ||
          path.startsWith('/camping/chat') ||
          path.startsWith('/camping/favorites')
        ) {
          return !!token;
        }
        
        // 其他路由允許訪問
        return true;
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
    // 後台路由
    '/admin/:path*',
    '/owner/:path*',
    
    // 需要登入的功能路由
    '/camping/profile/:path*',
    '/camping/checkout/:path*',
    '/camping/cart/:path*',
    '/camping/chat/:path*',
    '/camping/favorites/:path*',
    
    // 不包含根路徑 '/'
  ]
};

export function middleware(request) {
  // 只處理特定路徑
  const protectedPaths = ['/admin'];
  
  // 檢查當前路徑是否需要保護
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  );

  // 如果不是受保護的路徑，直接放行
  if (!isProtectedPath) {
    return NextResponse.next();
  }

  // 檢查是否已登入
  const token = request.cookies.get('next-auth.session-token');
  
  if (!token) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return NextResponse.next();
}
