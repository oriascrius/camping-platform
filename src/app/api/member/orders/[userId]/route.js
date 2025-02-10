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
        po.total_amount,
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

    return NextResponse.json(rows);
  } catch (error) {
    console.error("獲取歷史訂單失敗:", error);
    return NextResponse.json({ error: "獲取歷史訂單失敗" }, { status: 500 });
  }
}
