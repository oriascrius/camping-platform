import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('bookingId');
    
    console.log('接收到的訂單ID:', bookingId);

    if (!bookingId) {
      return NextResponse.json({ error: '未提供訂單編號' }, { status: 400 });
    }

    // 只獲取訂單基本資訊
    const [bookingResult] = await pool.query(`
      SELECT 
        booking_id,
        contact_name,
        contact_phone,
        contact_email,
        payment_method,
        total_price as total_amount,
        created_at,
        status,
        payment_status,
        quantity,
        booking_date as start_date,
        DATE_ADD(booking_date, INTERVAL 1 DAY) as end_date
      FROM bookings
      WHERE booking_id = ?
    `, [bookingId]);

    if (bookingResult.length === 0) {
      return NextResponse.json({ error: '找不到訂單' }, { status: 404 });
    }

    // 整理訂單資料格式
    const orderData = {
      ...bookingResult[0],
      items: [{
        activity_name: '露營活動',  // 預設值
        spot_name: '營位',         // 預設值
        start_date: bookingResult[0].start_date,
        end_date: bookingResult[0].end_date,
        quantity: bookingResult[0].quantity,
        unit_price: bookingResult[0].total_amount / bookingResult[0].quantity,
        subtotal: bookingResult[0].total_amount
      }]
    };

    console.log('返回的訂單資料:', orderData);
    return NextResponse.json(orderData);

  } catch (error) {
    console.error('詳細錯誤資訊:', error);
    return NextResponse.json({ 
      error: '獲取訂單資料失敗',
      details: error.message
    }, { status: 500 });
  }
}
