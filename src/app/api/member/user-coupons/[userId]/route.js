import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request, { params }) {
  try {
    const { userId } = params;

    // 查詢用戶的優惠券
    const query = `
      SELECT 
        id,
        discount,
        discount_value,
        expiry_date,
        status,
        created_at,
        updated_at
      FROM coupons
      WHERE user_id = ? AND status = 1
    `;
    const [rows] = await db.query(query, [userId]);

    if (rows.length === 0) {
      return NextResponse.json({ error: "沒有找到優惠券" }, { status: 404 });
    }

    return NextResponse.json(rows);
  } catch (error) {
    console.error("獲取優惠券失敗:", error);
    return NextResponse.json({ error: "獲取優惠券失敗" }, { status: 500 });
  }
}
