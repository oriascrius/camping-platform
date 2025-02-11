import db from "@/lib/db";

export async function GET(req, context) {
  const { params } = await context;
  const { id } = params;

  // 檢查 ID 是否為數字
  if (!id || isNaN(id)) {
    return new Response(JSON.stringify({ error: "Invalid thread ID" }), { status: 400 });
  }

  try {
    // 取得討論串的文章
    const [thread] = await db.execute(
      `SELECT * FROM forum_data WHERE id = ? AND status = 1`,
      [id]
    );

    if (thread.length === 0) {
      return new Response(JSON.stringify({ error: "Thread not found" }), { status: 404 });
    }

    // 取得回覆（改為 forum_reply_data）
    const [replies] = await db.execute(
      `SELECT * FROM forum_reply_data WHERE forum_id = ? AND status = 1 ORDER BY created_at ASC`,
      [id]
    );

    return new Response(JSON.stringify({ thread: thread[0], replies }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Database error", details: error.message }), { status: 500 });
  }
}
