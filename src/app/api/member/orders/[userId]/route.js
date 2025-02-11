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
        u.avatar,
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
        p.updated_at AS product_updated_at
      FROM product_orders po
      JOIN users u ON po.member_id = u.id
      JOIN product_order_details pod ON po.order_id = pod.order_id
      JOIN products p ON pod.product_id = p.id
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
