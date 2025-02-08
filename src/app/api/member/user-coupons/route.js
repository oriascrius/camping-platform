import db from "@/lib/db";

export async function GET(request) {
  try {
    // 获取 URL 查询参数
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");

    // 如果没有提供 user_id，则返回错误
    if (!userId) {
      return Response.json({ error: "缺少 user_id 参数" }, { status: 400 });
    }

    // 查询该用户的优惠券
    const query = "SELECT * FROM user_coupons WHERE user_id = ?";
    const [rows] = await db.query(query, [userId]);

    // 返回该用户的优惠券数据
    return Response.json(rows);
  } catch (error) {
    console.error("数据库错误:", error);
    return Response.json({ error: "数据库错误" }, { status: 500 });
  }
}