import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request, { params }) {
  try {
    const { userId } = await params;
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get("sortBy") || "end_date"; // 默認按結束日期排序
    const sortOrder = searchParams.get("sortOrder") || "ASC"; // 默認升序

    // 查詢用戶的優惠券
    const query = `
      SELECT 
        uc.id AS user_coupon_id,
        uc.name AS coupon_name,
        uc.coupon_code,
        uc.end_date,
        uc.discount,
        uc.discount_value AS user_discount_value,
        uc.min_purchase AS user_min_purchase,
        uc.max_discount AS user_max_discount,
        uc.end_date AS user_end_date,
        c.min_purchase AS coupon_min_purchase,
        c.max_discount AS coupon_max_discount,
        c.start_date,
        c.end_date AS coupon_end_date,
        c.status AS coupon_status,
        c.created_at AS coupon_created_at
      FROM user_coupons uc
      JOIN coupons c ON uc.coupon_code = c.coupon_code
      WHERE uc.user_id = ? AND c.status = 1
      ORDER BY ${sortBy} ${sortOrder}
    `;
    const [rows] = await db.execute(query, [userId]);

    if (rows.length === 0) {
      return NextResponse.json({ error: "沒有找到優惠券" }, { status: 404 });
    }

    return NextResponse.json(rows);
  } catch (error) {
    console.error("獲取優惠券失敗:", error);
    return NextResponse.json({ error: "獲取優惠券失敗" }, { status: 500 });
  }
}
