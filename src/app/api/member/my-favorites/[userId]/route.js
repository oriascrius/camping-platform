import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request, { params }) {
  try {
    const { userId } = await params;
    let articleRows = [];
    let forumRows = [];
    let forumFavoritesRows = [];

    // 嘗試查詢用戶的收藏文章
    try {
      const articleQuery = `
        SELECT DISTINCT
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
        JOIN article_like al ON a.id = al.article_id
        JOIN users u ON a.created_by = u.id
        JOIN article_categories ac ON a.article_category = ac.id
        WHERE al.user_id = ?
        GROUP BY a.id
      `;
      [articleRows] = await db.execute(articleQuery, [userId]);
    } catch (articleError) {
      console.error("獲取收藏文章失敗:", articleError);
      // 繼續執行不中斷，允許論壇查詢繼續
    }

    // 嘗試查詢用戶收藏的論壇文章 (從 forum_like 表)
    try {
      // 檢查forum_like表是否存在
      const [tables] = await db.execute(`SHOW TABLES LIKE 'forum_like'`);

      if (tables.length > 0) {
        const forumQuery = `
          SELECT DISTINCT
            f.id,
            f.category_id,
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
          JOIN forum_like fl ON f.id = fl.forum_id
          JOIN forum_topic_category ftc ON f.category_id = ftc.id
          WHERE fl.user_id = ?
          GROUP BY f.id
        `;
        [forumRows] = await db.execute(forumQuery, [userId]);
      }
    } catch (forumError) {
      console.error("獲取收藏論壇文章失敗 (forum_like):", forumError);
      // 繼續執行不中斷
    }

    // 新增: 嘗試查詢用戶收藏的論壇文章 (從 forum_favorites 表)
    try {
      // 檢查forum_favorites表是否存在
      const [favoritesTables] = await db.execute(
        `SHOW TABLES LIKE 'forum_favorites'`
      );

      if (favoritesTables.length > 0) {
        const forumFavoritesQuery = `
          SELECT DISTINCT
            f.id,
            f.category_id,
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
            'forum_favorites' AS content_type,
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
          JOIN forum_favorites ff ON f.id = ff.forum_id
          JOIN forum_topic_category ftc ON f.category_id = ftc.id
          WHERE ff.user_id = ?
          GROUP BY f.id
        `;
        [forumFavoritesRows] = await db.execute(forumFavoritesQuery, [userId]);
      }
    } catch (favoritesError) {
      console.error("獲取收藏論壇文章失敗 (forum_favorites):", favoritesError);
      // 繼續執行不中斷
    }

    // 合併三種收藏
    const combinedResults = [
      ...articleRows,
      ...forumRows,
      ...forumFavoritesRows,
    ];

    if (combinedResults.length === 0) {
      return NextResponse.json({ error: "沒有找到收藏文章" }, { status: 404 });
    }

    return NextResponse.json(combinedResults);
  } catch (error) {
    console.error("獲取收藏文章失敗:", error);
    return NextResponse.json({ error: "獲取收藏文章失敗" }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { userId } = await params;
    const body = await request.json();
    const { articleId, contentType = "article" } = body; // 獲取內容類型

    if (!articleId) {
      return NextResponse.json({ error: "缺少必要的參數" }, { status: 400 });
    }

    let query;
    let values;

    // 根據內容類型選擇不同的表
    if (contentType === "forum_favorites") {
      // 檢查表是否存在
      const [tables] = await db.execute(`SHOW TABLES LIKE 'forum_favorites'`);
      if (tables.length === 0) {
        return NextResponse.json(
          { error: "論壇收藏功能暫未開放" },
          { status: 400 }
        );
      }

      query = `
        INSERT INTO forum_favorites (user_id, forum_id, created_at) 
        VALUES (?, ?, NOW())
      `;
      values = [userId, articleId];
    } else if (contentType === "forum") {
      // 檢查表是否存在
      const [tables] = await db.execute(`SHOW TABLES LIKE 'forum_like'`);
      if (tables.length === 0) {
        return NextResponse.json(
          { error: "論壇收藏功能暫未開放" },
          { status: 400 }
        );
      }

      query = `
        INSERT INTO forum_like (user_id, forum_id) 
        VALUES (?, ?)
      `;
      values = [userId, articleId];
    } else {
      // 預設添加到文章收藏
      query = `
        INSERT INTO article_like (user_id, article_id) 
        VALUES (?, ?)
      `;
      values = [userId, articleId];
    }

    const [result] = await db.execute(query, values);

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "添加收藏失敗" }, { status: 500 });
    }

    return NextResponse.json({ message: "收藏添加成功" });
  } catch (error) {
    console.error("添加收藏失敗:", error);
    return NextResponse.json({ error: "添加收藏失敗" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { userId } = await params;
    const { articleId } = await request.json();

    if (!articleId) {
      return NextResponse.json({ error: "缺少必要的參數" }, { status: 400 });
    }

    // 刪除收藏文章
    const query = `
      DELETE FROM article_like
      WHERE user_id = ? AND article_id = ?
    `;
    const [result] = await db.execute(query, [userId, articleId]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "刪除收藏文章失敗" }, { status: 404 });
    }

    return NextResponse.json({ message: "收藏文章刪除成功" });
  } catch (error) {
    console.error("刪除收藏文章失敗:", error);
    return NextResponse.json({ error: "刪除收藏文章失敗" }, { status: 500 });
  }
}
