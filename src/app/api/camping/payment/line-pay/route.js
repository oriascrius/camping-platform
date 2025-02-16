import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createLinePayRequest } from '@/utils/payment/linepay';
import pool from '@/lib/db';

// LINE Pay 付款
export async function POST(request) {
  const connection = await pool.getConnection();
  
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: '請先登入' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();
    const { cartItems, totalAmount, contactInfo } = body;

    // 檢查必要參數
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json(
        { error: '購物車資料無效' },
        { status: 400 }
      );
    }

    // 檢查訂單是否已存在
    for (const item of cartItems) {
      const [existingOrders] = await connection.execute(
        `SELECT * FROM bookings 
         WHERE user_id = ? 
         AND option_id = ? 
         AND status != 'cancelled'
         AND (
           (start_date <= ? AND end_date >= ?) OR
           (start_date <= ? AND end_date >= ?) OR
           (start_date >= ? AND end_date <= ?)
         )`,
        [
          userId,
          item.option_id,
          item.end_date,
          item.start_date,
          item.start_date,
          item.end_date,
          item.start_date,
          item.end_date
        ]
      );

      if (existingOrders.length > 0) {
        return NextResponse.json(
          { error: '已有重複的預訂日期' },
          { status: 400 }
        );
      }
    }

    // 建立訂單
    const [orderResult] = await connection.execute(
      `INSERT INTO orders (user_id, total_amount, payment_method, status, contact_name, contact_phone, contact_email) 
       VALUES (?, ?, 'line_pay', 'pending', ?, ?, ?)`,
      [userId, totalAmount, contactInfo.contactName, contactInfo.contactPhone, contactInfo.contactEmail]
    );

    const orderId = orderResult.insertId;

    // 建立訂單明細
    for (const item of cartItems) {
      await connection.execute(
        `INSERT INTO order_items (order_id, option_id, quantity, start_date, end_date, price) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, item.option_id, item.quantity, item.start_date, item.end_date, item.price]
      );
    }

    // 建立 LINE Pay 請求
    const timestampId = Date.now();
    const linePayBody = {
      amount: totalAmount,
      currency: 'TWD',
      orderId: `CAMP${timestampId}`,
      packages: [
        {
          id: '1',
          amount: totalAmount,
          products: cartItems.map(item => ({
            id: item.option_id.toString(),
            name: item.activity_name,
            imageUrl: item.image_url || '',
            quantity: item.quantity,
            price: item.price
          }))
        }
      ],
      redirectUrls: {
        confirmUrl: `${process.env.BASE_URL}/api/camping/payment/line-pay/confirm`,
        cancelUrl: `${process.env.BASE_URL}/camping/checkout/linepay/cancel`
      }
    };

    const linePayResult = await createLinePayRequest(linePayBody);
    
    if (!linePayResult.success) {
      throw new Error('LINE Pay 請求失敗');
    }

    // 建立回應
    const response = NextResponse.json(linePayResult);

    // 設定 cookie
    response.cookies.set(`order_${orderId}`, JSON.stringify({
      items: cartItems,
      amount: totalAmount,
      contactInfo,
      userId,
      timestamp: timestampId
    }), {
      maxAge: 1800,
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    });

    return response;

  } catch (error) {
    console.error('LINE Pay 請求失敗:', error);
    return NextResponse.json(
      { error: 'LINE Pay 交易失敗' },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
} 