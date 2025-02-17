import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import pool from '@/lib/db';
// 綠界支付
// 綠界測試環境設定
const ECPAY_MERCHANT_ID = process.env.ECPAY_MERCHANT_ID;
const ECPAY_HASH_KEY = process.env.ECPAY_HASH_KEY;
const ECPAY_HASH_IV = process.env.ECPAY_HASH_IV;
const ECPAY_API_URL = process.env.NODE_ENV === 'production'
  ? 'https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5'
  : 'https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5';

// 產生檢查碼的函數
function generateCheckMacValue(params) {
  // 1. 將參數依照參數名稱的字母順序排序
  const sortedParams = Object.keys(params).sort().reduce((obj, key) => {
    obj[key] = params[key];
    return obj;
  }, {});

  // 2. 將參數串聯成 key=value 格式的字串
  const paramString = Object.entries(sortedParams)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  // 3. 在字串前後加上 HashKey 和 HashIV
  const rawString = `HashKey=${ECPAY_HASH_KEY}&${paramString}&HashIV=${ECPAY_HASH_IV}`;

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
  const checkMacValue = crypto
    .createHash('sha256')
    .update(encodedStringRule)
    .digest('hex')
    .toUpperCase();

  return checkMacValue;
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: '請先登入' }, { status: 401 });
    }

    const { items, amount, contactInfo } = await req.json();
    
    // 生成訂單編號
    const timestampId = Date.now();
    const orderId = parseInt(timestampId.toString().slice(-8));
    
    // 格式化日期為綠界要求的格式 (yyyy/MM/dd HH:mm:ss)
    const now = new Date();
    const merchantTradeDate = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    
    // 準備綠界所需參數
    const ecpayParams = {
      MerchantID: ECPAY_MERCHANT_ID,
      MerchantTradeNo: `CAMP${timestampId}`,
      MerchantTradeDate: merchantTradeDate,
      PaymentType: 'aio',
      TotalAmount: amount.toString(),
      TradeDesc: '露營商品預訂',
      ItemName: items.map(item => `${item.activity_name} x ${item.quantity}`).join('#'),
      ReturnURL: process.env.ECPAY_RETURN_URL,
      ClientBackURL: process.env.ECPAY_CLIENT_BACK_URL,
      OrderResultURL: process.env.ECPAY_ORDER_RESULT_URL,
      ChoosePayment: 'Credit',
      EncryptType: '1'
    };

    // 產生檢查碼
    ecpayParams.CheckMacValue = generateCheckMacValue(ecpayParams);

    // 建立 HTML form
    const formHTML = `
      <form id="ecpayForm" method="post" action="${ECPAY_API_URL}">
        ${Object.entries(ecpayParams)
          .map(([key, value]) => `<input type="hidden" name="${key}" value="${value}">`)
          .join('')}
      </form>
    `;

    // 儲存訂單資訊到資料庫
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 插入訂單資料到 bookings 表
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
          orderId,
          items[0].option_id,
          session.user.id,
          items[0].quantity,
          amount,
          contactInfo.contactName,
          contactInfo.contactPhone,
          contactInfo.contactEmail,
          'ecpay',
          'pending',
          'pending',
          timestampId
        ]
      );

      // 刪除購物車項目
      await connection.execute(
        'DELETE FROM activity_cart WHERE user_id = ? AND option_id = ?',
        [session.user.id, items[0].option_id]
      );

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    return NextResponse.json({
      success: true,
      form: formHTML
    });

  } catch (error) {
    console.error('綠界支付處理失敗:', error);
    return NextResponse.json(
      { error: '綠界支付處理失敗' },
      { status: 500 }
    );
  }
} 