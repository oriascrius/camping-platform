import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import pool from '@/lib/db';

export async function GET() {
  try {
    // 檢查管理員權限
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: '未授權' }, { status: 401 });
    }

    // 獲取一般會員列表
    const [users] = await pool.execute(
      `SELECT id, name, email, phone, status 
       FROM users 
       WHERE status = 1 
       ORDER BY created_at DESC`
    );

    // 檢查是否成功獲取數據
    if (!users) {
      console.error('未找到用戶數據');
      return NextResponse.json(
        { error: '未找到用戶數據' }, 
        { status: 404 }
      );
    }

    return NextResponse.json(users);

  } catch (error) {
    // 詳細記錄錯誤
    console.error('獲取會員列表失敗:', error);
    console.error('錯誤詳情:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });

    // 根據錯誤類型返回適當的錯誤信息
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return NextResponse.json(
        { error: '資料表不存在' }, 
        { status: 500 }
      );
    }

    if (error.code === 'ECONNREFUSED') {
      return NextResponse.json(
        { error: '無法連接到資料庫' }, 
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: '獲取會員列表失敗', details: error.message }, 
      { status: 500 }
    );
  }
} 