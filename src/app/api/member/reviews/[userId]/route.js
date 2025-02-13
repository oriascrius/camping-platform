import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request, { params }) {
  try {
    const { userId } = await params;
    const { searchParams } = new URL(request.url);
    const typeFilter = searchParams.get("type");

    // 查詢用戶的評論，並包含商品名稱和描述
    let query = `
      SELECT 
        ud.type,
        ud.item_id,
        ud.content,
        ud.rating,
        ud.status,
        ud.created_at,
        ud.updated_at,
        p.name AS product_name,
        p.description AS product_description
      FROM user_discussions ud
      LEFT JOIN products p ON ud.item_id = p.id AND ud.type = 'product'
      WHERE ud.user_id = ?
    `;

    const queryParams = [userId];

    if (typeFilter) {
      query += " AND ud.type = ?";
      queryParams.push(typeFilter);
    }

    const [rows] = await db.query(query, queryParams);

    if (rows.length === 0) {
      return NextResponse.json({ error: "沒有找到評論" }, { status: 404 });
    }

    return NextResponse.json(rows);
  } catch (error) {
    console.error("獲取評論失敗:", error);
    return NextResponse.json({ error: "獲取評論失敗" }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { userId } = await params;
    const { itemId, rating, content } = await request.json();

    // 更新用戶的評論評分和內容
    const query = `
      UPDATE user_discussions
      SET rating = ?, content = ?
      WHERE user_id = ? AND item_id = ?
    `;
    const [result] = await db.query(query, [rating, content, userId, itemId]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "更新評論失敗" }, { status: 404 });
    }

    return NextResponse.json({ success: "評論更新成功" });
  } catch (error) {
    console.error("更新評論失敗:", error);
    return NextResponse.json({ error: "更新評論失敗" }, { status: 500 });
  }
}
