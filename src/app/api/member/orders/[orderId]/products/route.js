// 檔案路徑：app/api/member/orders/[orderId]/products/route.js
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { verifyJWT } from "@/lib/auth"; // 假設您有驗證工具

export async function GET(request, { params }) {
  try {
    // 權限驗證
    const { user } = await verifyJWT(request);
    if (!user) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    // 參數驗證
    const { orderId } = params;
    if (!orderId || isNaN(orderId)) {
      return NextResponse.json({ error: "無效訂單編號" }, { status: 400 });
    }

    // 驗證訂單歸屬
    const [orderCheck] = await db.query(
      `SELECT member_id FROM product_orders 
       WHERE order_id = ?`,
      [orderId]
    );

    if (orderCheck.length === 0) {
      return NextResponse.json({ error: "訂單不存在" }, { status: 404 });
    }

    if (orderCheck[0].member_id !== user.id) {
      return NextResponse.json({ error: "權限不足" }, { status: 403 });
    }

    // 查詢訂單商品
    const query = `
      SELECT 
        p.id AS product_id,
        p.name,
        p.price,
        p.description,
        pi.image_path AS main_image,
        pod.quantity,
        IFNULL(ud.rating, 0) AS has_rated,
        ud.content AS review_content
      FROM product_order_details pod
      JOIN products p ON pod.product_id = p.id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_main = 1
      LEFT JOIN user_discussions ud 
        ON ud.item_id = p.id 
        AND ud.type = 'product'
        AND ud.order_id = pod.order_id
      WHERE pod.order_id = ?
    `;

    const [products] = await db.query(query, [orderId]);

    return NextResponse.json(products);
  } catch (error) {
    console.error("API錯誤:", error);
    return NextResponse.json(
      { error: "伺服器錯誤: " + error.message },
      { status: 500 }
    );
  }
}
