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
      return NextResponse.json({ error: '請先登入' }, { status: 401 });
    }

    const { items, amount, contactInfo } = await request.json();
    
    // 1. 建立 LINE Pay 請求
    const timestampId = Date.now();
    const orderId = `CAMP${timestampId}`;

    // 2. 檢查是否已存在相同的未完成訂單
    const [existingOrders] = await connection.execute(
      `SELECT * FROM bookings 
       WHERE user_id = ? 
       AND option_id = ? 
       AND payment_status = 'pending' 
       AND created_at > DATE_SUB(NOW(), INTERVAL 30 MINUTE)`,
      [session.user.id, items[0].option_id]
    );

    if (existingOrders.length > 0) {
      // 如果存在未完成的訂單，使用現有訂單
      const existingOrder = existingOrders[0];
      
      // 建立 LINE Pay 請求
      const linePayBody = {
        amount: amount,
        currency: 'TWD',
        orderId: `CAMP${existingOrder.timestamp_id}`,
        packages: [
          {
            id: '1',
            amount: amount,
            products: items.map(item => ({
              id: item.option_id.toString(),
              name: item.activity_name,
              imageUrl: item.image_url || '',
              quantity: item.quantity,
              price: item.total_price / item.quantity
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
        items,
        amount,
        contactInfo,
        userId: session.user.id,
        timestamp: existingOrder.timestamp_id
      }), {
        maxAge: 1800,
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
      });

      return response;

    } else {
      // 如果不存在未完成訂單，建立新訂單
      await connection.beginTransaction();
      
      // 插入訂單資料
      await connection.execute(
        `INSERT INTO bookings (
          order_id,
          option_id,
          user_id,
          quantity,
          total_price,
          contact_name,
          contact_phone,
          contact_email,
          payment_method,
          status,
          payment_status,
          timestamp_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          parseInt(timestampId.toString().slice(-8)),
          items[0].option_id,
          session.user.id,
          items[0].quantity,
          amount,
          contactInfo.contactName,
          contactInfo.contactPhone,
          contactInfo.contactEmail,
          'line_pay',
          'pending',
          'pending',
          timestampId
        ]
      );

      // 3. 建立 LINE Pay 請求
      const linePayBody = {
        amount: amount,
        currency: 'TWD',
        orderId: orderId,
        packages: [
          {
            id: '1',
            amount: amount,
            products: items.map(item => ({
              id: item.option_id.toString(),
              name: item.activity_name,
              imageUrl: item.image_url || '',
              quantity: item.quantity,
              price: item.total_price / item.quantity
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

      // 4. 成功建立支付請求後，提交資料庫交易
      await connection.commit();

      // 5. 建立回應
      const response = NextResponse.json(linePayResult);

      // 6. 在回應中設定 cookie
      response.cookies.set(`order_${orderId}`, JSON.stringify({
        items,
        amount,
        contactInfo,
        userId: session.user.id,
        timestamp: timestampId
      }), {
        maxAge: 1800,
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
      });

      return response;
    }

  } catch (error) {
    await connection.rollback();
    console.error('LINE Pay 請求失敗:', error);
    return NextResponse.json(
      { error: error.message || 'LINE Pay 請求失敗' },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
} 