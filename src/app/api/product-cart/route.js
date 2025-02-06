import { NextResponse } from "next/server";
// 假設你在 lib/db.js 設置了資料庫連線
import { db } from "@/lib/db";

// GET /api/product-cart
export async function GET(request) {
  // 你要鎖死的測試 userId
  const userId = 206;

  try {
    // 示範：查詢購物車資料 (假設表名叫 product_cart_items)
    const [rows] = await db.query(
      `
      SELECT c.id as cart_item_id,
             c.product_id,
             c.quantity,
             p.name as product_name,
             p.price as product_price
      FROM product_cart_items c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ?
    `,
      [userId]
    );

    // 回傳 JSON
    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST /api/product-cart
export async function POST(request) {
  // 同樣鎖死 userId = 206
  const userId = 206;

  try {
    // 從 request 中取得 body
    const body = await request.json();
    const { productId, quantity = 1 } = body;

    // 假設要做「如果已存在同商品，就更新數量；否則新增一筆」
    const [existing] = await db.query(
      `SELECT id, quantity 
       FROM product_cart_items
       WHERE user_id = ? AND product_id = ?
       LIMIT 1`,
      [userId, productId]
    );

    if (existing.length > 0) {
      // 已存在 -> 更新數量
      const cartItem = existing[0];
      const newQty = cartItem.quantity + quantity;
      await db.query(
        `UPDATE product_cart_items
         SET quantity = ?, updated_at = NOW()
         WHERE id = ?`,
        [newQty, cartItem.id]
      );
    } else {
      // 不存在 -> 新增
      await db.query(
        `INSERT INTO product_cart_items (user_id, product_id, quantity)
         VALUES (?, ?, ?)`,
        [userId, productId, quantity]
      );
    }

    return NextResponse.json(
      { message: "Add to cart success" },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/*
    ＧＥＴ請求回傳資料示例
    [
  {
    "id": 1,
    "user_id": 206,
    "product_id": 101,
    "quantity": 2,
    "created_at": "2025-02-06T06:30:00.000Z",
    "updated_at": "2025-02-06T06:30:00.000Z"
  },
    ]

    POST請求需傳入ＪＳＯＮ
    {
      "productId": 101,
      "quantity": 2
    }
*/
