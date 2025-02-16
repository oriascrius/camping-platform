import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import pool from '@/lib/db';
import { createLinePayRequest } from '@/utils/payment/linepay';
import { cookies } from 'next/headers';

// LINE Pay API 設定
// const LINE_PAY_CHANNEL_ID = process.env.LINE_PAY_CHANNEL_ID;
// const LINE_PAY_CHANNEL_SECRET = process.env.LINE_PAY_CHANNEL_SECRET;
// const LINE_PAY_VERSION = '2.3';
// const LINE_PAY_SANDBOX_URL = 'https://sandbox-api-pay.line.me';

// LINE Pay 付款
export async function POST(request) {
  const connection = await pool.getConnection();
  
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: '請先登入' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    
    // 只查詢 activity_cart 表
    const [cartItems] = await connection.execute(`
      SELECT * FROM activity_cart 
      WHERE user_id = ?
    `, [userId]);

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json({ error: '購物車資料無效' }, { status: 400 });
    }

    // 取得用戶資料
    const [userRows] = await connection.execute(
      `SELECT name, email, phone FROM users WHERE id = ?`,
      [userId]
    );
    const user = userRows[0];

    // 準備 LINE Pay 請求資料
    const orderData = {
      orderId: body.orderId,
      amount: body.amount,
      currency: 'TWD',
      packages: [{
        id: '1',
        amount: body.amount,
        products: cartItems.map(item => ({
          id: item.id.toString(),
          name: `活動預訂 #${item.id}`,
          quantity: item.quantity,
          price: Math.floor(item.total_price / item.quantity)
        }))
      }],
      redirectUrls: {
        confirmUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/camping/payment/line-pay/confirm`,
        cancelUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/camping/checkout/linepay/cancel`
      }
    };

    // 使用 linepay.js 的功能發送請求
    const linePayResult = await createLinePayRequest(orderData);
    console.log('LINE Pay API 回應:', linePayResult);  // 加入 log 方便除錯

    // 檢查 LINE Pay API 回應狀態
    if (linePayResult.success) {
      // 將訂單資訊存入 cookie
      const cookieStore = await cookies();
      await cookieStore.set(`order_${body.orderId}`, JSON.stringify({
        userId,
        cartItems,
        user,
        amount: body.amount
      }));

      // 直接回傳付款網址，不需要其他選項
      return NextResponse.json({
        success: true,
        web: linePayResult.paymentUrl,    // 網頁版付款連結
        app: linePayResult.appPaymentUrl,  // APP 版付款連結
      });
    } else {
      throw new Error('LINE Pay 請求失敗');
    }

  } catch (error) {
    console.error('LINE Pay 處理失敗:', error);
    return NextResponse.json({ error: '處理失敗' }, { status: 500 });
  } finally {
    connection.release();
  }
} 