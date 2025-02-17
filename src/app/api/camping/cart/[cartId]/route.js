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

    const cartId = await params.cartId;
    const userId = session.user.id;
    
    const body = await request.json();
    const { quantity } = body;

    if (!quantity || quantity < 1) {
      return NextResponse.json({ error: '無效的數量' }, { status: 400 });
    }

    // 修正 SQL 查詢，獲取所有需要的資訊
    const [cartItems] = await db.query(
      `SELECT 
        ac.*,
        aso.price as unit_price
       FROM activity_cart ac 
       LEFT JOIN activity_spot_options aso ON ac.option_id = aso.option_id 
       WHERE ac.id = ? AND ac.user_id = ?`,
      [cartId, userId]
    );

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json({ error: '找不到該購物車項目' }, { status: 404 });
    }

    const cartItem = cartItems[0];
    
    // 計算住宿晚數
    const startDate = new Date(cartItem.start_date);
    const endDate = new Date(cartItem.end_date);
    const diffTime = Math.abs(endDate - startDate);
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // 計算新的總價 (單價 × 晚數 × 數量)
    const newTotalPrice = cartItem.unit_price * nights * quantity;

    // 更新數量和總價
    const [result] = await db.query(
      `UPDATE activity_cart 
       SET quantity = ?, total_price = ?
       WHERE id = ? AND user_id = ?`,
      [quantity, newTotalPrice, cartId, userId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: '更新失敗' }, { status: 400 });
    }

    return NextResponse.json({ 
      message: '成功更新購物車',
      total_price: newTotalPrice
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