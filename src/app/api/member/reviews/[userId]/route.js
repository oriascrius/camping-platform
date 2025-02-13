import { NextResponse } from "next/server";
import db from "@/lib/db";
import { Await } from "react-router-dom";

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
