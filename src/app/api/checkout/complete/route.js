import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function GET(request) {
  console.log('開始處理請求');
  
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('bookingId');
    console.log('收到請求 bookingId:', bookingId);

    // 獲取連接池
    const pool = await getPool();
    
    let connection;
    try {
      connection = await pool.getConnection();
      console.log('成功獲取資料庫連接');

      // 其餘查詢邏輯保持不變
      const query = `
        SELECT 
          b.booking_id,
          b.quantity,
          b.total_price,
          b.payment_method,
          b.contact_name,
          b.contact_phone,
          b.contact_email,
          ao.name as option_name,
          a.name as activity_name,
          ao.start_date,
          ao.end_date
        FROM bookings b
        JOIN activity_options ao ON b.option_id = ao.id
        JOIN activities a ON ao.activity_id = a.id
        WHERE b.booking_id = ?
      `;

      const [bookings] = await connection.query(query, [bookingId]);
      
      if (!bookings || bookings.length === 0) {
        return NextResponse.json({ error: '找不到訂單' }, { status: 404 });
      }

      const booking = bookings[0];
      const response = {
        booking_id: booking.booking_id,
        items: [{
          activity_name: booking.activity_name,
          option_name: booking.option_name,
          quantity: booking.quantity,
          start_date: booking.start_date,
          end_date: booking.end_date,
        }],
        total_price: booking.total_price,
        payment_method: booking.payment_method,
        contact_name: booking.contact_name,
        contact_phone: booking.contact_phone,
        contact_email: booking.contact_email,
      };

      return NextResponse.json(response);

    } finally {
      if (connection) {
        connection.release();
      }
    }

  } catch (error) {
    console.error('API 錯誤:', error);
    return NextResponse.json(
      { error: '伺服器錯誤', details: error.message },
      { status: 500 }
    );
  }
} 