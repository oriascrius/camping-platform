import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');

    // 如果是管理員路由，但用戶不是管理員
    if (isAdminRoute && !['admin', 'super_admin'].includes(token?.role)) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    }
  }
);

export const config = {
  matcher: [
    '/admin/:path*',
    '/profile/:path*',
    '/checkout/:path*',
    '/cart/:path*'
  ]
};