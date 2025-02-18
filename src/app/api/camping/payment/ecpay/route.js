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
  const connection = await pool.getConnection();
  
  try {
    // 檢查用戶是否登入
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: '請先登入' }, { status: 401 });
    }

    // 取得請求資料
    const { items, amount, contactInfo } = await req.json();
    
    // 基本資料檢查
    if (!items?.[0] || !amount || !contactInfo) {
      return NextResponse.json({ error: '缺少必要資料' }, { status: 400 });
    }

    // 驗證所有必要欄位
    const required = {
      option_id: items[0].option_id,
      quantity: items[0].quantity,
      amount: amount,
      contactName: contactInfo.contactName,
      contactPhone: contactInfo.contactPhone,
      contactEmail: contactInfo.contactEmail
    };

    // 檢查是否有缺少的欄位
    const missingFields = Object.entries(required)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `缺少必要欄位: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // 生成訂單編號
    const timestampId = Date.now();
    const orderId = parseInt(timestampId.toString().slice(-8));
    
    // 格式化交易時間
    const now = new Date();
    const merchantTradeDate = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    // 準備綠界支付參數
    const ecpayParams = {
      MerchantID: ECPAY_MERCHANT_ID,
      MerchantTradeNo: `CAMP${timestampId}`,
      MerchantTradeDate: merchantTradeDate,
      PaymentType: 'aio',
      TotalAmount: amount.toString(),
      TradeDesc: encodeURIComponent('露營商品預訂'),
      ItemName: encodeURIComponent(items.map(item => `${item.activity_name} x ${item.quantity}`).join('#')),
      
      // 確保加入 CustomField1 存放 user_id
      CustomField1: session.user.id.toString(),
      
      // 1. 付款完成後，綠界會向這個 URL 發送交易結果通知
      ReturnURL: `${process.env.NEXT_PUBLIC_BASE_URL}/api/camping/payment/ecpay/notify`,
      
      // 2. 消費者點擊「返回商店」時，會導向這個 URL
      ClientBackURL: `${process.env.NEXT_PUBLIC_BASE_URL}/camping/checkout/ecpay/cancel`,
      
      // 3. 付款完成後，會自動導向這個 URL
      OrderResultURL: `${process.env.NEXT_PUBLIC_BASE_URL}/api/camping/payment/ecpay/handle-result`,
      
      ChoosePayment: 'Credit',
      EncryptType: '1',
    };

    // 加入除錯日誌
    console.log('ReturnURL:', ecpayParams.ReturnURL);

    // 加入檢查
    if (!process.env.ECPAY_MERCHANT_ID || !process.env.ECPAY_HASH_KEY || !process.env.ECPAY_HASH_IV) {
      console.error('綠界金流設定未完成');
      throw new Error('綠界金流設定未完成');
    }

    // 產生檢查碼
    ecpayParams.CheckMacValue = generateCheckMacValue(ecpayParams);

    // 將訂單資訊存入 Session 或 Redis（建議使用 Redis）
    // 這裡使用暫存資料，實際應該使用 Redis 或其他持久化存儲
    const orderData = {
      orderId,
      timestampId,
      items: items,
      amount,
      contactInfo,
      userId: session.user.id
    };

    // 可以使用 Redis 存儲
    // await redis.set(`order:${timestampId}`, JSON.stringify(orderData), 'EX', 3600); // 1小時過期

    // 產生 HTML 表單
    const formHTML = `
      <form id="ecpayForm" method="post" action="${ECPAY_API_URL}">
        ${Object.entries(ecpayParams)
          .map(([key, value]) => `<input type="hidden" name="${key}" value="${value}">`)
          .join('')}
      </form>
    `;

    return NextResponse.json({
      success: true,
      form: formHTML,
      orderData  // 可選：回傳訂單資訊供前端參考
    });

  } catch (error) {
    console.error('綠界支付處理失敗:', error);
    return NextResponse.json(
      { error: '綠界支付處理失敗' },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
} 