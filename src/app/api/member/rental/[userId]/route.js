// app/api/member/rental/[userId]/route.js
import { getServerSession } from "next-auth";
import db from "@/lib/db";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const { userId } = await params;
    const session = await getServerSession(authOptions);

    // 验证用户身份
    if (!session?.user?.id || session.user.id.toString() !== userId) {
      return NextResponse.json({ error: "未经授权的访问" }, { status: 401 });
    }

    // 获取租借数据
    const [leases] = await db.query(
      `
      SELECT 
        pl.id,
        pl.appointment_starts,
        pl.appointment_end,
        p.name AS product_name,
        p.description,
        GROUP_CONCAT(CONCAT('images/products/', pi.image_path)) AS images
      FROM products_lease pl
      JOIN products p ON pl.product_id = p.id
      LEFT JOIN product_images pi ON p.id = pi.product_id
      WHERE pl.user_id = ?
      GROUP BY pl.id
      ORDER BY pl.appointment_starts DESC
    `,
      [userId]
    );

    // 格式化图片数据
    const formattedLeases = leases.map((lease) => ({
      ...lease,
      images: lease.images ? lease.images.split(",") : [],
    }));

    return NextResponse.json({ leases: formattedLeases });
  } catch (error) {
    console.error("获取租借记录失败:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
