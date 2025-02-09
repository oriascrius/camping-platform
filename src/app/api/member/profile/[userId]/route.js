import { NextResponse } from "next/server";
import db from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET(request, { params }) {
  try {
    const { userId } = await params;

    // 查詢用戶基本資訊
    const query = `
      SELECT 
        id,
        email,
        name,
        phone,
        birthday,
        gender,
        address,
        avatar,
        created_at,
        updated_at
      FROM users
      WHERE id = ?
    `;
    const [rows] = await db.query(query, [userId]);

    if (rows.length === 0) {
      return NextResponse.json({ error: "用戶不存在" }, { status: 404 });
    }

    const user = rows[0];
    return NextResponse.json(user);
  } catch (error) {
    console.error("獲取用戶資料失敗:", error);
    return NextResponse.json({ error: "獲取用戶資料失敗" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { userId } = await params;
    const { name, address, phone, avatar, password } = await request.json();

    // 如果有提供新密碼，則加密新密碼
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // 更新用戶資料
    const query = `
      UPDATE users
      SET name = ?, address = ?, phone = ?, avatar = ?, password = COALESCE(?, password)
      WHERE id = ?
    `;
    const [result] = await db.query(query, [
      name,

      address,
      phone,
      avatar,
      hashedPassword,
      userId,
    ]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "更新失敗" }, { status: 404 });
    }

    return NextResponse.json({ message: "更新成功" });
  } catch (error) {
    console.error("更新用戶資料失敗:", error);
    return NextResponse.json({ error: "更新用戶資料失敗" }, { status: 500 });
  }
}
