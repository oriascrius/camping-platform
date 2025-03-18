import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request, { params }) {
  try {
    const { userId } = await params;
    let articleRows = [];
    let forumRows = [];

    // 嘗試查詢用戶的文章
    try {
      const articleQuery = `
        SELECT 
          a.id,
          a.article_category,
          ac.name AS article_category_name,
          a.title,
          a.subtitle,
          a.content,
          a.image_name,
          a.image_description,
          a.status,
          a.sort_order,
          a.views,
          a.created_at,
          a.updated_at,
          a.created_by,
          a.updated_by,
          'article' AS content_type,
          u.name, 
          u.gender,
          u.address,
          u.avatar,
          u.last_login,
          u.status AS user_status,
          u.created_at AS user_created_at,
          u.updated_at AS user_updated_at,
          u.login_type
        FROM articles a
        JOIN users u ON a.created_by = u.id
        JOIN article_categories ac ON a.article_category = ac.id
        WHERE a.created_by = ?
      `;
      [articleRows] = await db.execute(articleQuery, [userId]);
    } catch (articleError) {
      console.error("獲取用戶文章失敗:", articleError);
      // 繼續執行不中斷，允許論壇查詢繼續
    }

    // 嘗試查詢用戶發布的論壇文章
    try {
      // 檢查forum_data表是否存在
      const [tables] = await db.execute(`SHOW TABLES LIKE 'forum_data'`);

      if (tables.length > 0) {
        const forumQuery = `
          SELECT 
            f.id,
            f.category_id AS article_category,
            ftc.name AS article_category_name,
            f.thread_title AS title,
            '' AS subtitle,
            f.thread_content AS content,
            f.thread_image AS image_name,
            '' AS image_description,
            f.status,
            0 AS sort_order,
            0 AS views,
            f.created_at,
            f.updated_at,
            f.user_id AS created_by,
            f.user_id AS updated_by,
            'forum' AS content_type,
            f.user_name AS name,
            '' AS gender,
            '' AS address,
            f.user_avatar AS avatar,
            NULL AS last_login,
            1 AS user_status,
            f.created_at AS user_created_at,
            f.updated_at AS user_updated_at,
            '' AS login_type
          FROM forum_data f
          JOIN forum_topic_category ftc ON f.category_id = ftc.id
          WHERE f.user_id = ?
        `;
        [forumRows] = await db.execute(forumQuery, [userId]);
      }
    } catch (forumError) {
      console.error("獲取用戶論壇文章失敗:", forumError);
      // 繼續執行不中斷
    }

    // 合併兩種文章
    const combinedResults = [...articleRows, ...forumRows];

    if (combinedResults.length === 0) {
      return NextResponse.json({ error: "沒有找到文章" }, { status: 404 });
    }

    return NextResponse.json(combinedResults);
  } catch (error) {
    console.error("獲取文章失敗:", error);
    return NextResponse.json({ error: "獲取文章失敗" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { userId } = await params;
    const { id, content, contentType } = await request.json();

    if (!id || !content) {
      return NextResponse.json({ error: "缺少必要的參數" }, { status: 400 });
    }

    let query;
    let values;

    if (contentType === "forum") {
      // 更新論壇文章內容
      query = `
        UPDATE forum_data
        SET thread_content = ?, updated_at = NOW()
        WHERE id = ? AND user_id = ?
      `;
      values = [content, id, userId];
    } else {
      // 預設更新文章內容
      query = `
        UPDATE articles
        SET content = ?, updated_at = NOW()
        WHERE id = ? AND created_by = ?
      `;
      values = [content, id, userId];
    }

    const [result] = await db.execute(query, values);

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "更新文章失敗" }, { status: 404 });
    }

    return NextResponse.json({ message: "文章更新成功" });
  } catch (error) {
    console.error("更新文章失敗:", error);
    return NextResponse.json({ error: "更新文章失敗" }, { status: 500 });
  }
}
