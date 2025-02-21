import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import db from '@/lib/db';

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: '請先登入' },
        { status: 401 }
      );
    }

    const cartId = params.cartId;
    const userId = session.user.id;
    
    const {
      quantity,
      startDate,
      endDate,
      optionId,
      totalPrice,
    } = await request.json();

    // 加強資料驗證
    if (!quantity || quantity < 1) {
      return NextResponse.json({ error: '無效的數量' }, { status: 400 });
    }

    if (!startDate || !endDate) {
      return NextResponse.json({ error: '請選擇日期' }, { status: 400 });
    }

    if (!optionId) {
      return NextResponse.json({ error: '請選擇營位選項' }, { status: 400 });
    }

    if (!totalPrice || totalPrice < 0) {
      return NextResponse.json({ error: '無效的價格' }, { status: 400 });
    }

    // 更新購物車項目
    const [result] = await db.query(
      `UPDATE activity_cart 
       SET quantity = ?,
           start_date = ?,
           end_date = ?,
           option_id = ?,
           total_price = ?
       WHERE id = ? AND user_id = ?`,
      [quantity, startDate, endDate, optionId, totalPrice, cartId, userId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: '更新失敗' }, { status: 400 });
    }

    return NextResponse.json({ 
      message: '成功更新購物車',
      total_price: totalPrice
    });

  } catch (error) {
    console.error('更新購物車錯誤:', error);
    return NextResponse.json(
      { error: '更新購物車失敗' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: '請先登入' }, { status: 401 });
    }

    const cartId = params.cartId;
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