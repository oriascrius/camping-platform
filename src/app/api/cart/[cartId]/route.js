import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import db from '@/lib/db';

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: '請先登入' }, { status: 401 });
    }

    const cartId = params.cartId;
    if (!cartId) {
      return NextResponse.json({ error: '購物車項目ID不能為空' }, { status: 400 });
    }

    const userId = session.user.id;

    try {
      const [rows] = await db.query(
        'SELECT * FROM activity_cart WHERE id = ? AND user_id = ?',
        [cartId, userId]
      );

      if (!rows || rows.length === 0) {
        return NextResponse.json({ error: '找不到該購物車項目' }, { status: 404 });
      }

      const [result] = await db.query(
        'DELETE FROM activity_cart WHERE id = ? AND user_id = ?',
        [cartId, userId]
      );

      if (result.affectedRows === 0) {
        return NextResponse.json({ error: '刪除失敗' }, { status: 400 });
      }

      return NextResponse.json({ message: '成功刪除購物車項目' });

    } catch (dbError) {
      console.error('資料庫操作錯誤:', dbError);
      return NextResponse.json(
        { error: '資料庫操作失敗' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('刪除購物車項目時發生錯誤:', error);
    return NextResponse.json(
      { error: '刪除購物車項目失敗' },
      { status: 500 }
    );
  }
} 