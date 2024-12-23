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
    const { activityId } = await req.json();
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return Response.json({ error: '請先登入' }, { status: 401 });
    }

    const user_id = session.user.id;

    // 檢查活動是否存在
    const [activities] = await pool.query(
      'SELECT * FROM spot_activities WHERE activity_id = ? AND is_active = 1',
      [activityId]
    );

    if (!activities.length) {
      return Response.json({ error: '活動不存在' }, { status: 404 });
    }

    // 檢查購物車中是否已有此活動
    const [cartItems] = await pool.query(
      'SELECT * FROM activity_cart WHERE user_id = ? AND activity_id = ?',
      [user_id, activityId]
    );

    if (cartItems.length > 0) {
      return Response.json({ error: '此活動已在購物車中' }, { status: 400 });
    }

    // 將活動加入購物車，明確設定 option_id, start_date, end_date 為 NULL
    const [result] = await pool.query(
      `INSERT INTO activity_cart 
       (user_id, activity_id, quantity, option_id, start_date, end_date) 
       VALUES (?, ?, 1, NULL, NULL, NULL)`,
      [user_id, activityId]
    );

    return Response.json({ 
      success: true,
      message: '已加入購物車',
      cart_id: result.insertId 
    });

  } catch (error) {
    console.error('加入購物車詳細錯誤:', error);
    return Response.json({ 
      error: '加入購物車失敗',
      details: error.message 
    }, { 
      status: 500 
    });
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
      message: '從購物車移除'
    });

  } catch (error) {
    console.error('移除購物車項目失敗:', error);
    return NextResponse.json(
      { error: '移除購物車項目失敗' },
      { status: 500 }
    );
  }
} 