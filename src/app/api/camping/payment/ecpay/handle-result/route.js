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
          `SELECT * FROM activity_cart WHERE user_id = ?`,
          [params.CustomField1]
        );

        console.log('購物車資料:', cartRows);

        if (cartRows.length === 0) {
          throw new Error('找不到購物車資料');
        }

        const cartItem = cartRows[0];
        const currentTime = new Date();

        // 從 CustomField2, CustomField3, CustomField4 取得聯絡資訊
        const contactInfo = {
          name: params.CustomField2,      // 從綠界回傳的自訂欄位取得聯絡人姓名
          phone: params.CustomField3,     // 從綠界回傳的自訂欄位取得聯絡電話
          email: params.CustomField4      // 從綠界回傳的自訂欄位取得聯絡信箱
        };

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
            contactInfo.name,             // 使用綠界回傳的聯絡人姓名
            contactInfo.phone,            // 使用綠界回傳的聯絡電話
            contactInfo.email,            // 使用綠界回傳的聯絡信箱
            'ecpay',
            'paid',
            params.MerchantTradeNo.replace('CAMP', ''),  // timestamp_id
            cartItem.nights || 1,
            currentTime,                  // created_at
            currentTime                   // updated_at
          ]
        );

        console.log('訂單寫入成功，訂單編號:', params.MerchantTradeNo);

        // 清空購物車
        await connection.execute(
          'DELETE FROM activity_cart WHERE user_id = ?',
          [cartItem.user_id]
        );

        console.log('購物車清空成功');

        await connection.commit();
        console.log('交易提交成功');

        // 導向前
        console.log('準備導向到完成頁面:', `/camping/checkout/complete?orderId=${params.MerchantTradeNo}`);

        // 模仿 LINE Pay 的方式，直接導向到 complete 頁面
        return NextResponse.redirect(
          new URL(`/camping/checkout/complete?orderId=${params.MerchantTradeNo}`, request.url),
          303
        );

      } catch (error) {
        console.error('處理訂單時發生錯誤:', error);
        await connection.rollback();
        throw error;
      }
    } else {
      return NextResponse.redirect(
        new URL('/camping/checkout/cancel', request.url),
        303
      );
    }
  } catch (error) {
    console.error('處理付款結果失敗:', error);
    return NextResponse.redirect(
      new URL('/camping/checkout/cancel', request.url),
      303
    );
  } finally {
    connection.release();
  }
} 