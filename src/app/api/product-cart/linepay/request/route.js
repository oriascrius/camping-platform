import { NextResponse } from "next/server";
import { createLinePayRequest } from "@/utils/payment/linepay2";
import db from "@/lib/db";
import { cookies } from "next/headers";

export async function POST(req) {
  const connection = await db.getConnection();

  try {
    const { orderId } = await req.json();

    // ✅ **查詢訂單資訊**
    const [orderRows] = await connection.execute(
      "SELECT order_id, total_amount, shipping_fee FROM product_orders WHERE order_id = ?",
      [orderId]
    );

    if (orderRows.length === 0) {
      throw new Error("❌ 找不到訂單資訊");
    }

    const order = orderRows[0];

    // ✅ **查詢訂單商品**
    const [orderItems] = await connection.execute(
      `SELECT pod.product_id, pod.quantity, pod.price, p.name AS product_name
       FROM product_order_details pod
       JOIN products p ON pod.product_id = p.id
       WHERE pod.order_id = ?`,
      [orderId]
    );

    if (orderItems.length === 0) {
      throw new Error("❌ 訂單沒有商品資訊");
    }

    // ✅ **計算商品總額**
    const productTotal = orderItems.reduce(
      (sum, item) => sum + item.quantity * parseInt(item.price),
      0
    );

    const shippingFee = parseInt(order.shipping_fee);

    console.log(
      "📦 商品小計:",
      productTotal,
      "運費:",
      shippingFee,
      "訂單總額:",
      productTotal + shippingFee
    );

    // ✅ **建立付款請求**
    const orderData = {
      orderId: order.order_id.toString(),
      amount: productTotal, // ✅ **LINE Pay 只接受商品金額，不含運費**
      shippingFee,
      packages: [
        {
          id: "package-001",
          amount: productTotal, // ✅ **確保等於商品總額**
          products: orderItems.map((item) => ({
            id: item.product_id.toString(),
            name: item.product_name,
            quantity: item.quantity,
            price: parseInt(item.price),
          })),
        },
      ],
      redirectUrls: {
        confirmUrl: `${process.env.PRODUCT_LINEPAY_RETURN_HOST}${process.env.PRODUCT_LINEPAY_RETURN_CONFIRM_URL}?orderId=${orderId}&shippingFee=${shippingFee}`,
        cancelUrl: `${process.env.PRODUCT_LINEPAY_RETURN_HOST}${process.env.PRODUCT_LINEPAY_RETURN_CANCEL_URL}`,
      },
    };

    console.log("📦 修正後 LINE Pay 付款請求:", orderData);

    // ✅ **發送付款請求**
    const linePayResult = await createLinePayRequest(orderData, true);

    // ✅ **存入 Cookie**
    const cookieStore = await cookies();
    await cookieStore.set(`order_${orderId}`, JSON.stringify(orderData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 15,
    });

    return NextResponse.json({
      success: true,
      paymentUrl: linePayResult.paymentUrl,
    });
  } catch (error) {
    console.error("❌ LINE Pay 付款請求失敗:", error);
    return NextResponse.json({ error: "付款請求失敗" }, { status: 500 });
  } finally {
    connection.release();
  }
}
