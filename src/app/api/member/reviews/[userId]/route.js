import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request, { params }) {
  try {
    const { userId } = await params;

    // 查詢用戶的評論
    const query = `
      SELECT 
        type,
        item_id,
        content,
        rating,
        status,
        created_at,
        updated_at
      FROM user_discussions
      WHERE user_id = ?
    `;
    const [rows] = await db.query(query, [userId]);

    if (rows.length === 0) {
      return NextResponse.json({ error: "沒有找到評論" }, { status: 404 });
    }

    return NextResponse.json(rows);
  } catch (error) {
    console.error("獲取評論失敗:", error);
    return NextResponse.json({ error: "獲取評論失敗" }, { status: 500 });
  }
}
