import { NextResponse } from 'next/server';
import { verifyToken } from './lib/auth';

export function middleware(request) {
  const token = request.cookies.get('token');
  
  // 需要保護的路由
  const protectedPaths = ['/profile', '/settings'];
  const path = request.nextUrl.pathname;ˋ
  
  if (protectedPaths.includes(path)) {
    if (!token || !verifyToken(token.value)) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/profile', '/settings']
};