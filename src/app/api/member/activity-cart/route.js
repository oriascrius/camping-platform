import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST(request) {
  try {
    const { user_id, activity_id, option_id, quantity, start_date, end_date } =
      await request.json();

    const query = `
      INSERT INTO activity_cart (user_id, activity_id, option_id, quantity, start_date, end_date, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    const [result] = await db.query(query, [
      user_id,
      activity_id,
      option_id,
      quantity,
      start_date,
      end_date,
    ]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "加入購物車失敗" }, { status: 500 });
    }

    return NextResponse.json({ message: "加入購物車成功" });
  } catch (error) {
    console.error("加入購物車失敗:", error);
    return NextResponse.json({ error: "加入購物車失敗" }, { status: 500 });
  }
}
