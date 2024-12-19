import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json(
    { message: '登出成功' },
    { status: 200 }
  );

  // 清除 cookie
  response.cookies.set({
    name: 'user_id',
    value: '',
    expires: new Date(0),
    path: '/',
  });

  return response;
} 