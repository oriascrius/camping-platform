import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request, { params }) {
  try {
    const { userId } = await params;

    // 查詢用戶的歷史訂單
    const query = `
      SELECT 
        po.order_id AS order_id,
        po.member_id,
        po.payment_status,
        po.order_status,
        po.created_at AS order_created_at,
        po.updated_at AS order_updated_at,
        po.delivery_method,
        po.payment_method,
        po.used_coupon,
        po.shipping_address,
        po.recipient_name,
        po.recipient_phone,
        po.recipient_email,
        u.avatar,
        u.points,
        u.last_login,
        u.status AS user_status,
        u.created_at AS user_created_at,
        u.updated_at AS user_updated_at,
        u.login_type,
        pod.id AS order_detail_id,
        pod.product_id,
        pod.quantity,
        pod.price AS product_price,
        pod.created_at AS order_detail_created_at,
        p.name AS product_name,
        p.description AS product_description,
        p.price AS product_unit_price,
        p.stock AS product_stock,
        p.sort_order,
        p.status AS product_status,
        p.created_at AS product_created_at,
        p.updated_at AS product_updated_at,
        pi.image_path AS product_image
      FROM product_orders po
      JOIN users u ON po.member_id = u.id
      JOIN product_order_details pod ON po.order_id = pod.order_id
      JOIN products p ON pod.product_id = p.id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_main = 1
      WHERE po.member_id = ?
    `;
    const [rows] = await db.execute(query, [userId]);

    if (rows.length === 0) {
      return NextResponse.json({ error: "沒有找到歷史訂單" }, { status: 404 });
    }

    // 將查詢結果轉換為所需的結構
    const orders = rows.reduce((acc, row) => {
      const order = acc.find((o) => o.order_id === row.order_id);
      const product = {
        product_id: row.product_id,
        name: row.product_name,
        description: row.product_description,
        unit_price: row.product_unit_price,
        quantity: row.quantity,
        price: row.product_price,
        image: row.product_image,
      };

      if (order) {
        order.products.push(product);
        order.total_amount += product.quantity * product.unit_price;
      } else {
        acc.push({
          order_id: row.order_id,
          member_id: row.member_id,
          total_amount: product.quantity * product.unit_price,
          payment_status: row.payment_status,
          order_status: row.order_status,
          order_created_at: row.order_created_at,
          order_updated_at: row.order_updated_at,
          delivery_method: row.delivery_method,
          payment_method: row.payment_method,
          used_coupon: row.used_coupon,
          shipping_address: row.shipping_address,
          recipient_name: row.recipient_name,
          recipient_phone: row.recipient_phone,
          recipient_email: row.recipient_email,
          avatar: row.avatar,
          last_login: row.last_login,
          user_status: row.user_status,
          user_created_at: row.user_created_at,
          user_updated_at: row.user_updated_at,
          login_type: row.login_type,
          products: [product],
        });
      }

      return acc;
    }, []);

    return NextResponse.json(orders);
  } catch (error) {
    console.error("獲取歷史訂單失敗:", error);
    return NextResponse.json({ error: "獲取歷史訂單失敗" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { userId, orderId, points } = await req.json();

    // 檢查訂單是否已兌換
    const [check] = await db.execute(
      `SELECT converted FROM product_orders 
       WHERE order_id = ? AND member_id = ?`,
      [orderId, userId]
    );

    if (check[0]?.converted) {
      return NextResponse.json(
        { error: "該訂單已兌換過積分" },
        { status: 400 }
      );
    }

    // 更新用戶積分
    const [updateUser] = await db.execute(
      `UPDATE users SET points = points + ? 
       WHERE id = ?`,
      [points, userId]
    );

    // 標記訂單為已兌換
    const [updateOrder] = await db.execute(
      `UPDATE product_orders SET converted = 1 
       WHERE order_id = ?`,
      [orderId]
    );

    // 獲取最新積分
    const [user] = await db.execute(`SELECT points FROM users WHERE id = ?`, [
      userId,
    ]);

    return NextResponse.json({
      success: true,
      points: user[0].points,
    });
  } catch (error) {
    if (error.message !== "該訂單已兌換過積分") {
      console.error("積分兌換失敗:", error);
    }
    return NextResponse.json({ error: "積分兌換失敗" }, { status: 500 });
  }
}
