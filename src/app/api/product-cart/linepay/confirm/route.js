import { NextResponse } from "next/server";
import { confirmLinePayPayment } from "@/utils/payment/linepay2";
import db from "@/lib/db";
import { cookies } from "next/headers";

export async function GET(req) {
  const connection = await db.getConnection();

  try {
    const { searchParams } = new URL(req.url);
    const transactionId = searchParams.get("transactionId");
    const orderId = searchParams.get("orderId");
    const shippingFee = parseInt(searchParams.get("shippingFee")) || 0;

    if (!transactionId || !orderId) {
      throw new Error("❌ 缺少必要參數");
    }

    console.log(
      `📦 交易確認中: transactionId=${transactionId}, orderId=${orderId}, shippingFee=${shippingFee}`
    );

    // ✅ **取得存儲的訂單資訊**
    const cookieStore = await cookies();
    const orderDataCookie = await cookieStore.get(`order_${orderId}`);

    if (!orderDataCookie) {
      throw new Error(`❌ 找不到訂單資訊，cookie key: order_${orderId}`);
    }

    const orderData = JSON.parse(orderDataCookie.value);
    console.log("📦 解析的 Cookie 訂單資料:", orderData);

    // **額外檢查 `amount` 值**
    if (!orderData.amount || isNaN(parseInt(orderData.amount))) {
      console.error("❌ orderData.amount 讀取錯誤: ", orderData.amount);
      throw new Error("❌ 付款確認失敗: orderData.amount 為無效數值");
    }
    let productTotal = parseInt(orderData.amount);
    console.log("✅ 確保 `amount` 為有效數字:", productTotal);

    // ✅ **確保 amount 為有效數值**
    productTotal = parseInt(orderData.amount); // **確保為數字**
    if (isNaN(productTotal)) {
      throw new Error("❌ 付款確認失敗: amount 為無效數字");
    }

    // ✅ **確認付款**
    const confirmResult = await confirmLinePayPayment({
      transactionId,
      amount: productTotal, // **只傳商品總額，不包含運費**
    });

    if (confirmResult.returnCode !== "0000") {
      throw new Error(`❌ 付款確認失敗: ${confirmResult.returnMessage}`);
    }

    console.log("✅ LINE Pay 確認回應:", confirmResult);

    await connection.beginTransaction();

    try {
      // ✅ **更新 `product_orders` 付款狀態**
      await connection.execute(
        `UPDATE product_orders 
         SET payment_status = 1, 
             payment_method = 'line_pay', 
             total_amount = ?
         WHERE order_id = ?`,
        [productTotal + shippingFee, orderId]
      );

      await connection.commit();

      // ✅ **刪除 Cookie**
      await cookieStore.delete(`order_${orderId}`);

      console.log(`✅ 訂單 ${orderId} 付款成功！`);

      // ✅ **跳轉到成功畫面**
      return new NextResponse(
        `<!DOCTYPE html>
        <html>
          <head>
            <title>付款成功</title>
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.location.href = "/product-cart/order-confirmation/${orderId}";
                }, 2000);
              };
            </script>
          </head>
          <body>
            <div style="display:flex;justify-content:center;align-items:center;height:100vh;">
              <h1>✅ 付款成功！即將跳轉到訂單確認頁面...</h1>
            </div>
          </body>
        </html>`,
        {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        }
      );
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } catch (error) {
    console.error("❌ 確認付款失敗:", error);

    // ✅ **跳轉到失敗畫面**
    return new NextResponse(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>付款失敗</title>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.location.href = '/camping/checkout/linepay/cancel';
              }, 2000);
            };
          </script>
        </head>
        <body>
          <div style="display:flex;justify-content:center;align-items:center;height:100vh;">
            <h1>❌ 付款失敗: ${error.message}</h1>
          </div>
        </body>
      </html>`,
      {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  } finally {
    connection.release();
  }
}
