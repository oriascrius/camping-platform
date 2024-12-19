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

    // 開始資料庫交易
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 檢查營位是否還有空位
      const [options] = await connection.query(
        'SELECT * FROM activity_spot_options WHERE option_id = ? FOR UPDATE',
        [optionId]
      );

      if (options.length === 0) {
        throw new Error('找不到該營位選項');
      }

      const option = options[0];
      if (option.max_quantity < quantity) {
        throw new Error('該營位已無足夠空位');
      }

      // 建立預訂記錄
      const totalPrice = option.price * quantity;
      const [result] = await connection.query(
        `INSERT INTO bookings 
        (option_id, user_id, quantity, total_price, status) 
        VALUES (?, ?, ?, ?, 'pending')`,
        [optionId, session.user.id, quantity, totalPrice]
      );

      // 更新營位剩餘數量
      await connection.query(
        'UPDATE activity_spot_options SET max_quantity = max_quantity - ? WHERE option_id = ?',
        [quantity, optionId]
      );

      await connection.commit();

      return NextResponse.json({
        success: true,
        bookingId: result.insertId
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