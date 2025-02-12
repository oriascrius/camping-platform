import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createLinePayRequest } from '@/utils/payment/linepay';
// import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: '請先登入' }, { status: 401 });
    }

    const { items, amount, contactInfo } = await request.json();
    
    // 1. 建立 LINE Pay 請求
    const timestampId = Date.now();
    const orderId = `CAMP${timestampId}`;

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
        confirmUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/camping/payment/line-pay/confirm`,
        cancelUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/camping/checkout/linepay/cancel`
      }
    };

    // 2. 發送 LINE Pay 請求
    const linePayResult = await createLinePayRequest(linePayBody);
    console.log('LINE Pay API 回應:', linePayResult);

    if (!linePayResult.success) {
      throw new Error('LINE Pay 請求失敗');
    }

    // 3. 暫存訂單資訊到 cookie
    const orderData = {
      items,
      amount,
      contactInfo,
      userId: session.user.id,
      timestamp: timestampId
    };

    // 4. 建立回應
    const response = NextResponse.json(linePayResult);

    // 5. 在回應中設定 cookie
    response.cookies.set(`order_${orderId}`, JSON.stringify(orderData), {
      maxAge: 1800,
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    });

    return response;

  } catch (error) {
    console.error('LINE Pay 請求失敗:', error);
    return NextResponse.json(
      { error: error.message || 'LINE Pay 請求失敗' },
      { status: 500 }
    );
  }
} 