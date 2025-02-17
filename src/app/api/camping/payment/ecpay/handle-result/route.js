// 負責處理前端頁面導向，並且處理資料庫操作(寫入訂單、清空購物車)
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request) {
  const connection = await pool.getConnection();
  
  try {
    const data = await request.formData();
    const params = Object.fromEntries(data.entries());
    
    console.log('收到付款結果:', params);
    
    if (params.RtnCode === '1') {
      await connection.beginTransaction();

      try {
        // 查詢購物車資料
        const [cartRows] = await connection.execute(
          `SELECT ac.*, u.name as contact_name, u.phone as contact_phone, u.email as contact_email
           FROM activity_cart ac
           JOIN users u ON ac.user_id = u.id
           WHERE ac.user_id = ?`,
          [params.CustomField1]
        );

        console.log('購物車資料:', cartRows);

        if (cartRows.length === 0) {
          throw new Error('找不到購物車資料');
        }

        const cartItem = cartRows[0];
        const currentTime = new Date();

        // 寫入訂單
        await connection.execute(
          `INSERT INTO bookings (
            booking_id, order_id, option_id, user_id, 
            booking_date, status, quantity, total_price,
            contact_name, contact_phone, contact_email,
            payment_method, payment_status,
            timestamp_id, nights,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            Date.now(),                   // booking_id
            params.MerchantTradeNo,       // order_id
            cartItem.option_id,
            cartItem.user_id,
            currentTime,                  // booking_date
            'confirmed',
            cartItem.quantity,
            params.TradeAmt,
            cartItem.contact_name,
            cartItem.contact_phone || '', // 確保電話不為 null
            cartItem.contact_email,
            'ecpay',
            'paid',
            params.MerchantTradeNo.replace('CAMP', ''),  // timestamp_id
            cartItem.nights || 1,
            currentTime,                  // created_at
            currentTime                   // updated_at
          ]
        );

        console.log('訂單寫入成功');

        // 清空購物車
        await connection.execute(
          'DELETE FROM activity_cart WHERE user_id = ?',
          [cartItem.user_id]
        );

        console.log('購物車清空成功');

        await connection.commit();
        console.log('交易提交成功');

        return NextResponse.redirect(
          new URL('/camping/checkout/ecpay/success', request.url),
          303
        );

      } catch (error) {
        console.error('處理訂單時發生錯誤:', error);
        await connection.rollback();
        throw error;
      }
    } else {
      return NextResponse.redirect(
        new URL('/camping/checkout/ecpay/cancel', request.url),
        303
      );
    }
  } catch (error) {
    console.error('處理付款結果失敗:', error);
    return NextResponse.redirect(
      new URL('/camping/checkout/ecpay/cancel', request.url),
      303
    );
  } finally {
    connection.release();
  }
} 