import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    // 查詢用戶
    const [users] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return NextResponse.json(
        { error: '帳號或密碼錯誤' },
        { status: 401 }
      );
    }

    const user = users[0];

    // 驗證密碼
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: '帳號或密碼錯誤' },
        { status: 401 }
      );
    }

    // 更新最後登入時間
    await pool.query(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [user.id]
    );

    // 移除密碼後返回用戶信息
    delete user.password;

    // 創建回應
    const response = NextResponse.json({
      message: '登入成功',
      user
    });

    // 在回應中設置 cookie
    response.cookies.set({
      name: 'user_id',
      value: user.id.toString(),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 // 7 天
    });

    return response;

  } catch (error) {
    console.error('登入錯誤:', error);
    return NextResponse.json(
      { error: '登入過程發生錯誤' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: '請使用 POST 方法進行登入' },
    { status: 405 }
  );
}