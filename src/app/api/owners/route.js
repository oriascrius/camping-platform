import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import pool from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: '未授權' }, { status: 401 });
    }

    // 獲取營地主列表
    const [owners] = await pool.execute(
      `SELECT id, name, email, company_name, phone, status 
       FROM owners 
       WHERE status = 1 
       ORDER BY created_at DESC`
    );

    return NextResponse.json(owners);

  } catch (error) {
    console.error('獲取營地主列表失敗:', error);
    return NextResponse.json(
      { error: '獲取營地主列表失敗', details: error.message }, 
      { status: 500 }
    );
  }
} 