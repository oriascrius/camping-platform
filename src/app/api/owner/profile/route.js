import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import db from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: '未授權訪問' },
        { status: 401 }
      );
    }

    const sql = `
      SELECT *  -- 獲取所有欄位
      FROM owners 
      WHERE email = ? AND status = 1
    `;
    
    const result = await db.query(sql, [session.user.email]);

    if (result.length === 0) {
      return NextResponse.json(
        { error: '找不到營主資料' },
        { status: 404 }
      );
    }

    return NextResponse.json(result[0]);

  } catch (error) {
    console.error('獲取營主資料失敗:', error);
    return NextResponse.json(
      { error: '獲取資料失敗' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: '未授權訪問' },
        { status: 401 }
      );
    }

    const data = await request.json();
    
    const sql = `
      UPDATE owners 
      SET 
        name = ?,
        company_name = ?,
        phone = ?,
        address = ?
      WHERE email = ? AND status = 1
    `;

    await db.query(sql, [
      data.name,
      data.company_name || '',
      data.phone || null,
      data.address || null,
      session.user.email
    ]);

    return NextResponse.json({ message: '更新成功' });

  } catch (error) {
    console.error('更新營主資料失敗:', error);
    return NextResponse.json(
      { error: '更新資料失敗' },
      { status: 500 }
    );
  }
} 