import { NextResponse } from 'next/server';
import { confirmLinePayPayment } from '@/utils/payment/linepay';
import pool from '@/lib/db';
import { cookies } from 'next/headers';

export async function GET(request) {
  const connection = await pool.getConnection();
  
  try {
    // 1. 取得 LINE Pay 回調參數
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('transactionId');
    const orderId = searchParams.get('orderId');

    console.log('LINE Pay 回調參數:', { transactionId, orderId });

    if (!transactionId || !orderId) {
      throw new Error('缺少必要參數');
    }

    // 2. 從 cookie 取得訂單資訊
    const cookieStore = await cookies();
    const orderDataCookie = await cookieStore.get(`order_${orderId}`);
    if (!orderDataCookie) {
      throw new Error('找不到訂單資訊');
    }

    const orderInfo = JSON.parse(orderDataCookie.value);
    
    // 3. 確認付款狀態，傳入正確的金額
    const confirmResult = await confirmLinePayPayment({
      transactionId,
      orderId,
      amount: orderInfo.amount  // 加入金額參數
    });
    
    console.log('付款確認結果:', confirmResult);

    if (confirmResult.returnCode === '0000') {
      // 4. 付款成功，寫入資料庫
      await connection.beginTransaction();
      
      try {
        const [bookingResult] = await connection.query(
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
            booking_date,
            timestamp_id
          ) VALUES (
            ?,
            ?, ?, ?, ?, ?, ?, ?,
            'line_pay',
            'confirmed',
            'paid',
            NOW(),
            ?
          )`,
          [
            parseInt(orderInfo.timestamp.toString().slice(-8)),
            orderInfo.items[0].option_id,
            orderInfo.userId,
            orderInfo.items[0].quantity,
            orderInfo.amount,
            orderInfo.contactInfo.contactName,
            orderInfo.contactInfo.contactPhone,
            orderInfo.contactInfo.contactEmail,
            orderInfo.timestamp
          ]
        );

        // 只刪除活動購物車項目
        await connection.query(
          'DELETE FROM activity_cart WHERE user_id = ? AND option_id = ?',
          [orderInfo.userId, orderInfo.items[0].option_id]
        );

        await connection.commit();
        
        // 5. 清除 cookie
        const response = NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/camping/checkout/linepay/success`
        );
        response.cookies.delete(`order_${orderId}`);
        return response;

      } catch (error) {
        console.error('訂單處理失敗:', error);
        await connection.rollback();
        throw error;
      }
    } else {
      // 付款失敗
      throw new Error('付款確認失敗');
    }

  } catch (error) {
    console.error('確認付款失敗:', error);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    return NextResponse.redirect(
      `${baseUrl}/camping/checkout/linepay/cancel`
    );
  } finally {
    connection.release();
  }
}