import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  async function middleware(req) {
    const token = req.nextauth.token;
    const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');
    
    if (isAdminRoute) {
      if (!token?.isAdmin) {
        if (token) {
          return NextResponse.redirect(new URL('/', req.url));
        }
        return NextResponse.redirect(new URL('/auth/login', req.url));
      }
    }

    return NextResponse.next({
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Pragma': 'no-cache',
      }
    });
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');
        if (isAdminRoute) {
          return token?.isAdmin === true;
        }
        return !!token;
      }
    },
    pages: {
      signIn: '/auth/login',
    }
  }
);

export const config = {
  matcher: [
    '/admin/:path*',
    '/camping/:path*',
    '/camping/profile/:path*',
    '/camping/checkout/:path*',
    '/camping/cart/:path*'
  ]
};
