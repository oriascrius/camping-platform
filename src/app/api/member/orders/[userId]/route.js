import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request, { params }) {
  try {
    const { userId } = await params;

    // 查詢用戶的歷史訂單
    const query = `
      SELECT 
        order_id,
        user_id,
        total_amount,
        payment_status,
        order_status,
        created_at,
        updated_at
      FROM product_order_details
      WHERE user_id = ?
    `;
    const [rows] = await db.query(query, [userId]);

    if (rows.length === 0) {
      return NextResponse.json({ error: "沒有找到歷史訂單" }, { status: 404 });
    }

    return NextResponse.json(rows);
  } catch (error) {
    console.error("獲取歷史訂單失敗:", error);
    return NextResponse.json({ error: "獲取歷史訂單失敗" }, { status: 500 });
  }
}
