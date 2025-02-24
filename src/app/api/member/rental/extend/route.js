// app/api/member/rental/extend/route.js
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request) {
  try {
    const { leaseId, newDate } = await request.json();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "需要登录才能操作" }, { status: 401 });
    }

    // 验证租借记录
    const [existingLease] = await db.query(
      "SELECT * FROM products_lease WHERE id = ? AND user_id = ?",
      [leaseId, session.user.id]
    );

    if (existingLease.length === 0) {
      return NextResponse.json({ error: "找不到租借记录" }, { status: 404 });
    }

    // 验证日期
    const currentEnd = new Date(existingLease[0].appointment_end);
    const newEnd = new Date(newDate);

    if (newEnd <= currentEnd) {
      return NextResponse.json(
        { error: "新日期必须晚于当前日期" },
        { status: 400 }
      );
    }

    // 更新数据库
    await db.query(
      "UPDATE products_lease SET appointment_end = ? WHERE id = ?",
      [newDate, leaseId]
    );

    return NextResponse.json({
      success: true,
      newEndDate: newDate,
    });
  } catch (error) {
    console.error("延长租借失败:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
