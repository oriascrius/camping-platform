import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');
    
    console.log('Token in middleware:', token);
    console.log('Current path:', req.nextUrl.pathname);

    if (isAdminRoute) {
      if (!token || !token.isAdmin) {
        return NextResponse.redirect(new URL('/auth/login', req.url), {
          headers: {
            'Cache-Control': 'no-store, max-age=0',
          }
        });
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        console.log('Authorization check:', token);
        return !!token;
      }
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
