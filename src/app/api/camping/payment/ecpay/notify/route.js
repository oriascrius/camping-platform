import { NextResponse } from 'next/server';
import crypto from 'crypto';
import pool from '@/lib/db';

// 產生檢查碼的函數
function generateCheckMacValue(params) {
  // 移除 CheckMacValue
  const { CheckMacValue, ...restParams } = params;
  
  // 1. 將參數依照參數名稱的字母順序排序
  const sortedParams = Object.keys(restParams).sort().reduce((obj, key) => {
    obj[key] = restParams[key];
    return obj;
  }, {});

  // 2. 將參數串聯成 key=value 格式的字串
  const paramString = Object.entries(sortedParams)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  // 3. 在字串前後加上 HashKey 和 HashIV
  const rawString = `HashKey=${process.env.ECPAY_HASH_KEY}&${paramString}&HashIV=${process.env.ECPAY_HASH_IV}`;

  // 4. 進行 URL encode
  const encodedString = encodeURIComponent(rawString).toLowerCase();

  // 5. 轉換成符合規則的字串
  const encodedStringRule = encodedString
    .replace(/%20/g, '+')
    .replace(/%2d/g, '-')
    .replace(/%5f/g, '_')
    .replace(/%2e/g, '.')
    .replace(/%21/g, '!')
    .replace(/%2a/g, '*')
    .replace(/%28/g, '(')
    .replace(/%29/g, ')');

  // 6. 使用 SHA256 產生 CheckMacValue
  return crypto
    .createHash('sha256')
    .update(encodedStringRule)
    .digest('hex')
    .toUpperCase();
}

export async function POST(request) {
  const connection = await pool.getConnection();
  
  try {
    const data = await request.formData();
    const params = Object.fromEntries(data.entries());

    // 取得基礎 URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    // 驗證檢查碼
    const calculatedCheckMacValue = generateCheckMacValue(params);
    if (calculatedCheckMacValue !== params.CheckMacValue) {
      throw new Error('CheckMacValue 驗證失敗');
    }

    // 驗證付款結果
    if (params.RtnCode === '1') {
      // 付款成功
      await connection.execute(
        `UPDATE bookings 
         SET status = 'confirmed', 
             payment_status = 'paid'
         WHERE order_id = ?`,
        [params.MerchantTradeNo.replace('CAMP', '')]
      );

      // 使用相對路徑重定向
      return Response.redirect('/camping/checkout/ecpay/success', 302);
    } else {
      // 付款失敗
      await connection.execute(
        `UPDATE bookings 
         SET payment_status = 'failed'
         WHERE order_id = ?`,
        [params.MerchantTradeNo.replace('CAMP', '')]
      );

      return Response.redirect('/camping/checkout/ecpay/cancel', 302);
    }
  } catch (error) {
    console.error('綠界付款通知處理失敗:', error);
    return Response.redirect('/camping/checkout/ecpay/cancel', 302);
  } finally {
    connection.release();
  }
} 