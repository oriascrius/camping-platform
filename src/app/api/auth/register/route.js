import { NextResponse } from 'next/server';
import crypto from 'crypto';
import pool from '@/lib/db';

export async function POST(request) {
  try {
    const { name, email, password } = await request.json();

    // 檢查必要欄位
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: '所有欄位都是必填的' },
        { status: 400 }
      );
    }

    // 檢查 email 格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '無效的 email 格式' },
        { status: 400 }
      );
    }

    // 檢查 email 是否已存在
    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: '此 email 已被註冊' },
        { status: 400 }
      );
    }

    // MD5 加密密碼
    const hashedPassword = crypto
      .createHash('md5')
      .update(password)
      .digest('hex');

    // 插入新用戶
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword]
    );

    return NextResponse.json({
      message: '註冊成功',
      userId: result.insertId
    });

  } catch (error) {
    console.error('註冊錯誤:', error);
    return NextResponse.json(
      { error: '註冊失敗，請稍後再試' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: '請使用 POST 方法進行註冊' },
    { status: 405 }
  );
}