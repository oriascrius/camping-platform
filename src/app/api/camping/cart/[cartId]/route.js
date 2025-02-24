import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import db from '@/lib/db';

export async function PUT(request, { params }) {
  console.log('收到 PUT 請求，參數:', params);
  
  try {
    const session = await getServerSession(authOptions);
    console.log('使用者狀態:', {
      isAuthenticated: !!session,
      userId: session?.user?.id
    });

    if (!session) {
      return NextResponse.json({ error: "請先登入" }, { status: 401 });
    }

    const cartId = params.cartId;
    const requestData = await request.json();
    console.log('請求內容:', {
      cartId,
      requestData
    });

    const {
      quantity,
      startDate,
      endDate,
      optionId,
      totalPrice,
    } = requestData;

    // 記錄解析後的資料
    console.log('解析後的資料:', {
      quantity,
      startDate,
      endDate,
      optionId,
      totalPrice,
      userId: session.user.id
    });

    // 驗證資料
    if (!cartId || !quantity || quantity < 1) {
      console.log('資料驗證失敗:', { cartId, quantity });
      return NextResponse.json({ error: '無效的請求參數' }, { status: 400 });
    }

    // 加強資料驗證
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
      [quantity, startDate, endDate, optionId, totalPrice, cartId, session.user.id]
    );

    console.log('資料庫更新結果:', {
      affectedRows: result.affectedRows,
      changedRows: result.changedRows
    });

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: '找不到對應的購物車項目' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: '購物車已更新'
    });

  } catch (error) {
    console.error('處理請求時發生錯誤:', {
      message: error.message,
      stack: error.stack
    });
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