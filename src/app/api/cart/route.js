import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// 獲取購物車內容
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    console.log('GET - Session 狀態:', !!session);
    
    if (!session) {
      return NextResponse.json({ cartItems: [] });
    }

    const [users] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [session.user.email]
    );

    console.log('GET - 找到用戶:', users[0]?.id);

    if (!users.length) {
      return NextResponse.json({ cartItems: [] });
    }

    const userId = users[0].id;

    // 直接檢查購物車表
    const [cartCheck] = await pool.query(
      'SELECT * FROM activity_cart WHERE user_id = ?',
      [userId]
    );
    console.log('GET - 原始購物車數據:', cartCheck);

    // 修改查詢以確保所有關聯都正確
    const [cartItems] = await pool.query(`
      SELECT 
        ac.id as cart_id,
        ac.quantity,
        ac.activity_id,
        aso.price,
        aso.option_id,
        csa.name as spot_name,
        sa.title,
        sa.subtitle,
        sa.main_image,
        sa.start_date,
        sa.end_date
      FROM activity_cart ac
      JOIN spot_activities sa ON ac.activity_id = sa.activity_id
      JOIN activity_spot_options aso ON ac.option_id = aso.option_id
      LEFT JOIN camp_spot_applications csa ON sa.application_id = csa.spot_id
      WHERE ac.user_id = ?
      ORDER BY ac.created_at DESC
    `, [userId]);

    console.log('GET - 查詢結果:', cartItems);

    return NextResponse.json({ cartItems });

  } catch (error) {
    console.error('GET - 獲取購物車失敗:', error);
    console.error('GET - 錯誤詳情:', error.stack);
    return NextResponse.json(
      { error: '獲取購物車失敗' },
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

    // 將活動加入購物車，明確設定 option_id 為 NULL
    const [result] = await pool.query(
      `INSERT INTO activity_cart 
       (user_id, activity_id, quantity, option_id, start_date, end_date) 
       VALUES (?, ?, ?, NULL, NULL, NULL)`,
      [user_id, activityId, 1]
    );

    if (!result.insertId) {
      throw new Error('插入購物車失敗');
    }

    return Response.json({ 
      success: true,
      message: '已加入購物車',
      cart_id: result.insertId 
    });

  } catch (error) {
    console.error('加入購物車詳細錯誤:', error);
    return Response.json({ 
      error: error.message || '加入購物車失敗',
      details: error.toString()
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