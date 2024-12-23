import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// 獲取購物車內容
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return Response.json({ error: '請先登入' }, { status: 401 });
    }

    // 修正查詢，使用正確的資料表欄位名稱
    const [cartItems] = await pool.query(`
      SELECT 
        ac.id as cart_id,
        ac.user_id,
        ac.activity_id,
        ac.option_id,
        ac.quantity,
        ac.start_date as selected_start_date,
        ac.end_date as selected_end_date,
        ac.created_at,
        ac.updated_at,
        sa.activity_name,
        sa.title,
        sa.main_image,
        sa.description,
        sa.start_date as activity_start_date,
        sa.end_date as activity_end_date,
        sa.is_active,
        csa.name as spot_name,
        csa.price,
        csa.capacity
      FROM activity_cart ac
      LEFT JOIN spot_activities sa ON ac.activity_id = sa.activity_id
      LEFT JOIN camp_spot_applications csa ON ac.option_id = csa.spot_id
      WHERE ac.user_id = ?
      GROUP BY ac.id
      ORDER BY ac.created_at DESC
    `, [session.user.id]);

    // 處理價格顯示
    const formattedCartItems = cartItems.map(item => ({
      ...item,
      activity_name: item.activity_name || item.title, // 使用 activity_name 或 title
      price_range: `NT$ ${item.price?.toLocaleString() || '0'}`
    }));

    return Response.json({ 
      cartItems: formattedCartItems,
      total: cartItems.length
    });

  } catch (error) {
    console.error('獲取購物車失敗:', error);
    return Response.json(
      { error: '獲取購物車失敗', details: error.message },
      { status: 500 }
    );
  }
}

// 新增購物車項目
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: "請先登入" }, { status: 401 });
    }

    const {
      activityId,
      quantity,
      totalPrice,
      isQuickAdd, // 新增參數，用於判斷是否從列表快速加入
      ...otherParams // 其他參數（詳細頁面會用到）
    } = await req.json();

    // 驗證基本參數
    if (!activityId || !quantity) {
      return Response.json({ error: "缺少必要參數" }, { status: 400 });
    }

    // 檢查購物車是否已有此活動
    const [existingItems] = await pool.query(
      'SELECT * FROM activity_cart WHERE user_id = ? AND activity_id = ?',
      [session.user.id, activityId]
    );

    if (existingItems.length > 0) {
      if (isQuickAdd) {
        // 如果是快速加入且已存在，只更新數量
        await pool.query(
          'UPDATE activity_cart SET quantity = ? WHERE user_id = ? AND activity_id = ?',
          [quantity, session.user.id, activityId]
        );
      } else {
        // 如果是從詳細頁面，更新所有相關欄位
        await pool.query(`
          UPDATE activity_cart 
          SET quantity = ?,
              start_date = ?,
              end_date = ?,
              option_id = ?,
              total_price = ?
          WHERE user_id = ? AND activity_id = ?
        `, [
          quantity,
          otherParams.startDate || null,
          otherParams.endDate || null,
          otherParams.optionId || null,
          totalPrice,
          session.user.id,
          activityId
        ]);
      }
      return Response.json({ message: "購物車已更新" });
    }

    // 新增購物車項目
    let insertQuery = '';
    let insertParams = [];

    if (isQuickAdd) {
      // 快速加入時只插入必要欄位
      insertQuery = `
        INSERT INTO activity_cart 
        (user_id, activity_id, quantity, total_price)
        VALUES (?, ?, ?, ?)
      `;
      insertParams = [session.user.id, activityId, quantity, totalPrice];
    } else {
      // 從詳細頁面加入時插入所有欄位
      insertQuery = `
        INSERT INTO activity_cart 
        (user_id, activity_id, option_id, quantity, start_date, end_date, total_price)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      insertParams = [
        session.user.id,
        activityId,
        otherParams.optionId || null,
        quantity,
        otherParams.startDate || null,
        otherParams.endDate || null,
        totalPrice
      ];
    }

    const [result] = await pool.query(insertQuery, insertParams);

    return Response.json({ 
      message: "成功加入購物車",
      cartItemId: result.insertId 
    });

  } catch (error) {
    console.error('加入購物車錯誤:', error);
    return Response.json({ error: "加入購物車失敗" }, { status: 500 });
  }
}

// 更新購物車數量
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: '請先登入' },
        { status: 401 }
      );
    }

    const { cartId, quantity } = await request.json();
    
    await pool.query(
      'UPDATE activity_cart SET quantity = ? WHERE id = ? AND user_id = ?',
      [quantity, cartId, session.user.id]
    );

    return NextResponse.json({ 
      success: true,
      message: '已更新數量'
    });

  } catch (error) {
    console.error('更新購物車數量失敗:', error);
    return NextResponse.json(
      { error: '更新購物車數量失敗' },
      { status: 500 }
    );
  }
}

// 移除購物車項目
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: '請先登入' },
        { status: 401 }
      );
    }

    const { cartId } = await request.json();
    
    await pool.query(
      'DELETE FROM activity_cart WHERE id = ? AND user_id = ?',
      [cartId, session.user.id]
    );

    return NextResponse.json({ 
      success: true,
      message: '從購物車除'
    });

  } catch (error) {
    console.error('移除購物車項目失敗:', error);
    return NextResponse.json(
      { error: '移除購物車項目失敗' },
      { status: 500 }
    );
  }
} 