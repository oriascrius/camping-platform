import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      email, 
      password, 
      name, 
      phone, 
      birthday, 
      gender, 
      address 
    } = body;

    // 檢查郵箱是否已存在
    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: '此電子郵件已被註冊' },
        { status: 400 }
      );
    }

    // 密碼加密
    const hashedPassword = await bcrypt.hash(password, 10);

    // 插入新用戶
    const [result] = await pool.query(
      `INSERT INTO users 
       (email, password, name, phone, birthday, gender, address, avatar, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [email, hashedPassword, name, phone, birthday, gender, address, 'default-avatar.png']
    );

    return NextResponse.json({
      message: '註冊成功',
      userId: result.insertId
    });

  } catch (error) {
    console.error('註冊錯誤:', error);
    return NextResponse.json(
      { error: '註冊過程發生錯誤' },
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