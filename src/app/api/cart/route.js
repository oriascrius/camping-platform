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
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    console.log('POST - Session 狀態:', !!session);
    
    if (!session) {
      return NextResponse.json(
        { error: '請先登入' },
        { status: 401 }
      );
    }

    // 獲取用戶 ID
    const [users] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [session.user.email]
    );

    if (!users.length) {
      return NextResponse.json(
        { error: '找不到用戶' },
        { status: 404 }
      );
    }

    const userId = users[0].id;
    const { activityId, optionId, quantity = 1 } = await request.json();
    
    console.log('POST - 接收到的數據:', {
      userId,
      activityId,
      optionId,
      quantity
    });

    // 檢查活動和選項是否存在
    const [activityOptions] = await pool.query(`
      SELECT aso.* 
      FROM activity_spot_options aso
      JOIN spot_activities sa ON aso.activity_id = sa.activity_id
      WHERE sa.activity_id = ? AND aso.option_id = ?
    `, [activityId, optionId]);

    console.log('POST - 找到的活動選項:', activityOptions);

    if (!activityOptions.length) {
      return NextResponse.json(
        { error: '找不到指定的活動或選項' },
        { status: 404 }
      );
    }

    // 檢查是否已在購物車中
    const [existingItems] = await pool.query(
      'SELECT * FROM activity_cart WHERE user_id = ? AND activity_id = ? AND option_id = ?',
      [userId, activityId, optionId]
    );

    console.log('POST - 現有購物車項目:', existingItems);

    if (existingItems.length > 0) {
      // 更新數量
      await pool.query(
        'UPDATE activity_cart SET quantity = quantity + ? WHERE user_id = ? AND activity_id = ? AND option_id = ?',
        [quantity, userId, activityId, optionId]
      );
      console.log('POST - 更新購物車數量');
    } else {
      // 新增項目
      await pool.query(
        'INSERT INTO activity_cart (user_id, activity_id, option_id, quantity) VALUES (?, ?, ?, ?)',
        [userId, activityId, optionId, quantity]
      );
      console.log('POST - 新增購物車項目');
    }

    return NextResponse.json({ 
      success: true,
      message: '已加入購物車'
    });

  } catch (error) {
    console.error('POST - 加入購物車失敗:', error);
    return NextResponse.json(
      { error: '加入購物車失敗' },
      { status: 500 }
    );
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
      message: '已從購物車移除'
    });

  } catch (error) {
    console.error('移除購物車項目失敗:', error);
    return NextResponse.json(
      { error: '移除購物車項目失敗' },
      { status: 500 }
    );
  }
} 