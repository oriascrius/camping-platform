import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request) {
  const connection = await pool.getConnection();
  
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: '請先登入' }, { status: 401 });
    }

    const { 
      items,
      amount,  // 這是前端計算好的總金額
      contactInfo,
      paymentMethod = 'cash'
    } = await request.json();

    // 檢查必要資料
    if (!items || !items.length) {
      throw new Error('購物車是空的');
    }

    await connection.beginTransaction();

    // 生成訂單編號和時間戳記
    const timestamp_id = Date.now();
    const order_id = timestamp_id;  // 使用時間戳作為 order_id

    // 為每個項目建立訂單
    for (const item of items) {
      if (!item.optionId) {
        throw new Error('營位選項資料不完整');
      }

      // 檢查營位選項是否存在
      const [optionCheck] = await connection.query(
        `SELECT aso.*, sa.activity_name
         FROM activity_spot_options aso
         LEFT JOIN spot_activities sa ON aso.activity_id = sa.activity_id
         WHERE aso.option_id = ? FOR UPDATE`,
        [item.optionId]
      );
      
      if (optionCheck.length === 0) {
        throw new Error(`找不到營位選項: ${item.optionId}`);
      }

      // 1. 檢查實際可用數量（使用 camp_spot_applications 的 capacity）
      const [availabilityCheck] = await connection.query(`
        SELECT 
          csa.capacity as total_capacity,
          (
            csa.capacity - COALESCE(
              (SELECT SUM(b.quantity)
               FROM bookings b
               WHERE b.option_id = aso.option_id
               AND b.status != 'cancelled'
               AND b.payment_status != 'failed'),
              0
            )
          ) as available_quantity
        FROM activity_spot_options aso
        JOIN camp_spot_applications csa ON aso.spot_id = csa.spot_id
        WHERE aso.option_id = ? 
        FOR UPDATE`,  // 加入鎖定機制
        [item.optionId]
      );

      // 2. 檢查數量是否足夠
      if (availabilityCheck[0].available_quantity < item.quantity) {
        throw new Error(`營位數量不足，目前剩餘 ${availabilityCheck[0].available_quantity} 個`);
      }

      // 使用前端傳來的總金額
      const totalPrice = item.total_price;

      // 3. 寫入訂單（不更新 max_quantity）
      const [insertResult] = await connection.query(
        `INSERT INTO bookings (
          order_id,
          timestamp_id,
          option_id,
          user_id,
          quantity,
          total_price,
          contact_name,
          contact_phone,
          contact_email,
          status,
          payment_status,
          payment_method,
          booking_date,
          nights
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
        [
          order_id,
          timestamp_id,
          item.optionId,
          session.user.id,
          item.quantity,
          totalPrice,
          contactInfo.contactName,
          contactInfo.contactPhone,
          contactInfo.contactEmail,
          'pending',    // 訂單狀態
          'pending',    // 付款狀態
          paymentMethod,
          item.nights || 1
        ]
      );
    }

    // 清空使用者的營地購物車 (修正表名為 activity_cart)
    await connection.query(
      `DELETE FROM activity_cart 
       WHERE user_id = ? AND activity_id IN (
         SELECT sa.activity_id 
         FROM spot_activities sa
         JOIN activity_spot_options aso ON sa.activity_id = aso.activity_id
         WHERE aso.option_id IN (?)
       )`,
      [session.user.id, items.map(item => item.optionId)]
    );

    await connection.commit();

    return NextResponse.json({
      success: true,
      orderId: order_id,
      timestampId: timestamp_id,
      message: '訂單建立成功，請於現場付款'
    });

  } catch (error) {
    await connection.rollback();
    console.error('預訂失敗:', error);
    return NextResponse.json(
      { error: error.message || '預訂失敗' },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}

// 獲取預訂詳情的 GET 方法
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: '請先登入' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');  // 改用 orderId

    if (!orderId) {
      return NextResponse.json({ error: '未提供訂單編號' }, { status: 400 });
    }

    const [bookings] = await pool.query(
      `SELECT b.*, 
        aso.spot_name as option_name,
        sa.activity_name
      FROM bookings b
      JOIN activity_spot_options aso ON b.option_id = aso.option_id
      JOIN spot_activities sa ON aso.activity_id = sa.activity_id
      WHERE b.order_id = ? AND b.user_id = ?`,  // 改用 order_id 查詢
      [orderId, session.user.id]
    );

    if (bookings.length === 0) {
      return NextResponse.json({ error: '找不到訂單記錄' }, { status: 404 });
    }

    return NextResponse.json(bookings[0]);

  } catch (error) {
    console.error('獲取訂單詳情失敗:', error);
    return NextResponse.json(
      { error: '獲取訂單詳情失敗' },
      { status: 500 }
    );
  }
} 