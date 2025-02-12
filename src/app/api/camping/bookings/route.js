import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: '請先登入' }, { status: 401 });
    }

    const { optionId, quantity, activityId } = await request.json();
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // 1. 檢查 activity_spot_options
      const [options] = await connection.query(
        `SELECT aso.*, sa.activity_name, csa.name as spot_name
         FROM activity_spot_options aso
         LEFT JOIN spot_activities sa ON aso.activity_id = sa.activity_id
         LEFT JOIN camp_spot_applications csa ON aso.spot_id = csa.spot_id
         WHERE aso.option_id = ? FOR UPDATE`,
        [optionId]
      );

      if (options.length === 0) {
        throw new Error('找不到該營位選項');
      }

      const option = options[0];
      if (option.max_quantity < quantity) {
        throw new Error('該營位已無足夠空位');
      }

      // 2. 寫入 bookings 表
      const bookingId = Date.now();  // 使用時間戳
      const totalPrice = option.price * quantity;
      
      const [bookingResult] = await connection.query(
        `INSERT INTO bookings 
         (booking_id, option_id, user_id, quantity, total_price, status) 
         VALUES (?, ?, ?, ?, ?, 'pending')`,
        [bookingId, optionId, session.user.id, quantity, totalPrice]
      );

      // 3. 更新 activity_spot_options 的數量
      await connection.query(
        `UPDATE activity_spot_options 
         SET max_quantity = max_quantity - ? 
         WHERE option_id = ?`,
        [quantity, optionId]
      );

      await connection.commit();

      return NextResponse.json({
        success: true,
        bookingId: bookingId,
        bookingDetails: {
          activityName: option.activity_name,
          spotName: option.spot_name,
          quantity: quantity,
          totalPrice: totalPrice
        }
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('預訂失敗:', error);
    return NextResponse.json(
      { error: error.message || '預訂失敗' },
      { status: 500 }
    );
  }
} 