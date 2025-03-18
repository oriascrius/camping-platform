import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function DELETE(request, { params }) {
  try {
    const { userId, articleId } = await params;
    // 從URL獲取內容類型參數
    const url = new URL(request.url);
    const contentType = url.searchParams.get("type") || "article";

    if (!articleId) {
      return NextResponse.json({ error: "缺少必要的參數" }, { status: 400 });
    }

    let result;

    // 根據內容類型選擇不同的表
    if (contentType === "forum_favorites") {
      try {
        // 先檢查表是否存在
        const [tables] = await db.execute(`SHOW TABLES LIKE 'forum_favorites'`);

        if (tables.length > 0) {
          const query = `
            DELETE FROM forum_favorites
            WHERE user_id = ? AND forum_id = ?
          `;
          [result] = await db.execute(query, [userId, articleId]);
        } else {
          return NextResponse.json(
            { error: "論壇收藏功能暫未開放" },
            { status: 404 }
          );
        }
      } catch (error) {
        console.error("刪除論壇收藏失敗 (forum_favorites):", error);
        return NextResponse.json(
          { error: "刪除論壇收藏失敗" },
          { status: 500 }
        );
      }
    } else if (contentType === "forum") {
      try {
        // 先檢查表是否存在
        const [tables] = await db.execute(`SHOW TABLES LIKE 'forum_like'`);

        if (tables.length > 0) {
          const query = `
            DELETE FROM forum_like
            WHERE user_id = ? AND forum_id = ?
          `;
          [result] = await db.execute(query, [userId, articleId]);
        } else {
          return NextResponse.json(
            { error: "論壇收藏功能暫未開放" },
            { status: 404 }
          );
        }
      } catch (error) {
        console.error("刪除論壇收藏失敗 (forum_like):", error);
        return NextResponse.json(
          { error: "刪除論壇收藏失敗" },
          { status: 500 }
        );
      }
    } else {
      // 刪除文章收藏
      const query = `
        DELETE FROM article_like
        WHERE user_id = ? AND article_id = ?
      `;
      [result] = await db.execute(query, [userId, articleId]);
    }

    if (!result || result.affectedRows === 0) {
      return NextResponse.json({ error: "刪除收藏文章失敗" }, { status: 404 });
    }

    return NextResponse.json({ message: "收藏文章刪除成功" });
  } catch (error) {
    console.error("刪除收藏文章失敗:", error);
    return NextResponse.json({ error: "刪除收藏文章失敗" }, { status: 500 });
  }
}
