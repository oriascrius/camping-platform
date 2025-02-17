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

    const orderInfo = JSON.parse(orderDataCookie.value);
    
    const confirmResult = await confirmLinePayPayment({
      transactionId,
      orderId,
      amount: orderInfo.amount
    });
    
    if (confirmResult.returnCode === '0000') {
      await connection.beginTransaction();
      
      try {
        await connection.execute(
          `UPDATE bookings 
           SET status = 'confirmed', 
               payment_status = 'paid'
           WHERE timestamp_id = ?`,
          [orderInfo.timestamp]
        );

        await connection.execute(
          'DELETE FROM activity_cart WHERE user_id = ? AND option_id = ?',
          [orderInfo.userId, orderInfo.items[0].option_id]
        );

        await connection.commit();
        
        // 回傳 HTML 頁面，包含自動關閉視窗的腳本
        return new NextResponse(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>付款完成</title>
              <script>
                window.onload = function() {
                  // 通知原視窗付款成功
                  if (window.opener) {
                    window.opener.postMessage('LINE_PAY_SUCCESS', '*');
                  }
                  // 3秒後關閉視窗
                  setTimeout(function() {
                    window.close();
                    // 如果視窗沒有關閉（例如在某些行動裝置上），則重定向到成功頁面
                    window.location.href = '/camping/checkout/linepay/success';
                  }, 3000);
                }
              </script>
            </head>
            <body>
              <div style="
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                text-align: center;
                font-family: Arial, sans-serif;
              ">
                <div>
                  <h1 style="color: #4CAF50;">付款成功！</h1>
                  <p>視窗將在 3 秒後自動關閉...</p>
                </div>
              </div>
            </body>
          </html>
        `, {
          headers: {
            'Content-Type': 'text/html; charset=utf-8'
          }
        });

      } catch (error) {
        await connection.rollback();
        throw error;
      }
    } else {
      await connection.execute(
        `UPDATE bookings 
         SET payment_status = 'failed'
         WHERE timestamp_id = ?`,
        [orderInfo.timestamp]
      );

      // 回傳失敗的 HTML 頁面
      return new NextResponse(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>付款失敗</title>
            <script>
              window.onload = function() {
                // 通知原視窗付款失敗
                if (window.opener) {
                  window.opener.postMessage('LINE_PAY_CANCEL', '*');
                }
                // 3秒後關閉視窗
                setTimeout(function() {
                  window.close();
                  // 如果視窗沒有關閉，則重定向到取消頁面
                  window.location.href = '/camping/checkout/linepay/cancel';
                }, 3000);
              }
            </script>
          </head>
          <body>
            <div style="
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              text-align: center;
              font-family: Arial, sans-serif;
            ">
              <div>
                <h1 style="color: #f44336;">付款失敗</h1>
                <p>視窗將在 3 秒後自動關閉...</p>
              </div>
            </div>
          </body>
        </html>
      `, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8'
        }
      });
    }

  } catch (error) {
    console.error('確認付款失敗:', error);
    return new NextResponse(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>付款錯誤</title>
          <script>
            window.onload = function() {
              // 通知原視窗付款失敗
              if (window.opener) {
                window.opener.postMessage('LINE_PAY_CANCEL', '*');
              }
              // 3秒後關閉視窗
              setTimeout(function() {
                window.close();
                // 如果視窗沒有關閉，則重定向到取消頁面
                window.location.href = '/camping/checkout/linepay/cancel';
              }, 3000);
            }
          </script>
        </head>
        <body>
          <div style="
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            text-align: center;
            font-family: Arial, sans-serif;
          ">
            <div>
              <h1 style="color: #f44336;">系統錯誤</h1>
              <p>視窗將在 3 秒後自動關閉...</p>
            </div>
          </div>
        </body>
      </html>
    `, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8'
      }
    });
  } finally {
    connection.release();
  }
}