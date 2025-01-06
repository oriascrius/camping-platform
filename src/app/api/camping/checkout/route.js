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

    const { cartItems, contactInfo } = await request.json();
    console.log('收到的資料:', { cartItems, contactInfo }); // 除錯用

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const bookingIds = [];
      
      for (const item of cartItems) {
        console.log('處理購物車項目:', item); // 除錯用

        // 檢查必要資料
        if (!item.option_id || !item.quantity || !item.total_price || !item.start_date || !item.end_date) {
          throw new Error('購物車項目資料不完整');
        }

        // 建立預訂記錄
        const [bookingResult] = await connection.query(
          `INSERT INTO bookings (
            option_id,
            user_id,
            quantity,
            total_price,
            contact_name,
            contact_phone,
            contact_email,
            payment_method,
            status,
            payment_status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending')`,
          [
            item.option_id,
            session.user.id,
            item.quantity,
            item.total_price,
            contactInfo.contactName,
            contactInfo.contactPhone,
            contactInfo.contactEmail,
            contactInfo.paymentMethod
          ]
        );

        const bookingId = bookingResult.insertId;
        bookingIds.push(bookingId);
        console.log('建立的預訂ID:', bookingId); // 除錯用

        // 寫入預訂日期資料
        await connection.query(
          `INSERT INTO booking_dates (
            booking_id,
            check_in_date,
            check_out_date
          ) VALUES (?, ?, ?)`,
          [
            bookingId,
            item.start_date,
            item.end_date
          ]
        );

        // 更新活動名額
        const [updateResult] = await connection.query(
          `UPDATE activity_spot_options 
           SET max_quantity = max_quantity - ? 
           WHERE option_id = ?`,
          [item.quantity, item.option_id]
        );

        if (updateResult.affectedRows === 0) {
          throw new Error(`無法更新活動名額: ${item.option_id}`);
        }
      }

      // 清空購物車
      await connection.query(
        'DELETE FROM activity_cart WHERE user_id = ?',
        [session.user.id]
      );

      await connection.commit();

      return NextResponse.json({
        success: true,
        bookingIds: bookingIds,
        message: '預訂成功'
      });

    } catch (error) {
      await connection.rollback();
      console.error('交易失敗:', error);
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

// 獲取預訂詳情的 GET 方法
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: '請先登入' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('bookingId');

    if (!bookingId) {
      return NextResponse.json({ error: '未提供預訂編號' }, { status: 400 });
    }

    const [bookings] = await pool.query(
      `SELECT b.*, 
        co.name as option_name,
        ca.name as activity_name
      FROM bookings b
      JOIN camping_options co ON b.option_id = co.id
      JOIN camping_activities ca ON co.activity_id = ca.id
      WHERE b.booking_id = ? AND b.user_id = ?`,
      [bookingId, session.user.id]
    );

    if (bookings.length === 0) {
      return NextResponse.json({ error: '找不到預訂記錄' }, { status: 404 });
    }

    return NextResponse.json(bookings[0]);

  } catch (error) {
    console.error('獲取預訂詳情失敗:', error);
    return NextResponse.json(
      { error: '獲取預訂詳情失敗' },
      { status: 500 }
    );
  }
} 