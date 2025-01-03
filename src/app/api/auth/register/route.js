import { NextResponse } from 'next/server';
import crypto from 'crypto';
import pool from '@/lib/db';

export async function POST(request) {
  try {
    const { email, password, role } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: '電子信箱和密碼為必填欄位' }, { status: 400 });
    }

    const connection = await pool.getConnection();

    try {
      // 分開檢查 email 是否存在
      const [existingUsers] = await connection.query(
        'SELECT email FROM users WHERE email = ?',
        [email]
      );

      const [existingOwners] = await connection.query(
        'SELECT email FROM owners WHERE email = ?',
        [email]
      );

      if (existingUsers.length > 0 || existingOwners.length > 0) {
        return NextResponse.json({ error: '此電子信箱已被註冊' }, { status: 400 });
      }

      // 密碼加密
      const hashedPassword = crypto
        .createHash('md5')
        .update(password)
        .digest('hex');

      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

      if (role === 'owner') {
        await connection.query(
          'INSERT INTO owners (email, password, name, status, created_at) VALUES (?, ?, ?, ?, ?)',
          [email, hashedPassword, email.split('@')[0], 1, now]
        );
      } else {
        // 為 users 表的必填欄位提供預設值
        await connection.query(`
          INSERT INTO users (
            email, 
            password, 
            name,
            phone,
            birthday,
            gender,
            address,
            avatar,
            status,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            email,
            hashedPassword,
            email.split('@')[0],        // 使用 email 前綴作為預設名稱
            '未設定',                    // 預設電話
            '2000-01-01',              // 預設生日
            'male',                     // 預設性別
            '未設定',                    // 預設地址
            'default-avatar.png',       // 預設大頭貼
            1,                          // 狀態啟用
            now,                        // 建立時間
            now                         // 更新時間
          ]
        );
      }

      return NextResponse.json({ 
        success: true,
        message: '註冊成功',
        role: role 
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('註冊錯誤:', error);
    return NextResponse.json({ 
      success: false,
      error: '註冊過程發生錯誤',
      details: error.message 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(
    { message: '請使用 POST 方法進行註冊' },
    { status: 405 }
  );
}