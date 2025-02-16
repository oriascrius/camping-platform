import { NextResponse } from 'next/server';
import { confirmLinePayPayment } from '@/utils/payment/linepay';
import pool from '@/lib/db';
import { cookies } from 'next/headers';

export async function GET(request) {
  const connection = await pool.getConnection();
  
  try {
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('transactionId');
    const orderId = searchParams.get('orderId');

    if (!transactionId || !orderId) {
      throw new Error('缺少必要參數');
    }

    const cookieStore = cookies();
    const orderDataCookie = cookieStore.get(`order_${orderId}`);
    
    if (!orderDataCookie) {
      throw new Error('找不到訂單資訊');
    }

    const orderData = JSON.parse(orderDataCookie.value);
    
    const confirmResult = await confirmLinePayPayment({
      transactionId,
      amount: orderData.amount
    });
    
    if (confirmResult.returnCode === '0000') {
      await connection.beginTransaction();
      
      try {
        await connection.execute(
          `UPDATE bookings 
           SET status = ?, 
               payment_status = ?, 
               payment_method = ?
           WHERE order_id = ?`,
          ['confirmed', 'paid', 'line_pay', orderId]
        );

        if (orderData.userId) {
          await connection.execute(
            'DELETE FROM activity_cart WHERE user_id = ?',
            [orderData.userId]
          );
        }

        await connection.commit();
        
        return new NextResponse(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>付款完成</title>
              <script>
                window.onload = function() {
                  if (window.opener) {
                    window.opener.postMessage('LINE_PAY_SUCCESS', '*');
                  }
                  setTimeout(function() {
                    window.close();
                    window.location.href = '/camping/checkout/linepay/success';
                  }, 3000);
                }
              </script>
            </head>
            <body>
              <div style="display:flex;justify-content:center;align-items:center;height:100vh;">
                <h1>付款成功！視窗將在3秒後關閉...</h1>
              </div>
            </body>
          </html>
        `, {
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });

      } catch (error) {
        await connection.rollback();
        throw error;
      }
    } else {
      throw new Error('付款確認失敗');
    }

  } catch (error) {
    console.error('確認付款失敗:', error);
    return new NextResponse(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>付款失敗</title>
          <script>
            window.onload = function() {
              if (window.opener) {
                window.opener.postMessage('LINE_PAY_CANCEL', '*');
              }
              setTimeout(function() {
                window.close();
                window.location.href = '/camping/checkout/linepay/cancel';
              }, 3000);
            }
          </script>
        </head>
        <body>
          <div style="display:flex;justify-content:center;align-items:center;height:100vh;">
            <h1>付款失敗：${error.message}</h1>
          </div>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  } finally {
    connection.release();
  }
}