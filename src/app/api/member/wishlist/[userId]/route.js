import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request, { params }) {
  try {
    const { userId } = await params;

    // 查詢用戶的願望清單
    const query = `
      SELECT 
        id,
        user_id,
        
        type,
        item_id,
        created_at
      FROM user_favorites
      WHERE user_id = ?
    `;
    const [rows] = await db.query(query, [userId]);

    if (rows.length === 0) {
      return NextResponse.json({ error: "沒有找到願望清單" }, { status: 404 });
    }

    return NextResponse.json(rows);
  } catch (error) {
    console.error("獲取願望清單失敗:", error);
    return NextResponse.json({ error: "獲取願望清單失敗" }, { status: 500 });
  }
}
