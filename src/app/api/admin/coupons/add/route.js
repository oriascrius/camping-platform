import db from "@/lib/db";
import { message } from "antd";
import { headers } from "next/headers";

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      name,
      coupon_code,
      discount_type,
      discount_value,
      min_purchase,
      max_discount,
      start_date,
      end_date,
      level_id,
    } = body;

    // 檢查必填欄位，包括日期
    if (
      !name ||
      !coupon_code ||
      !discount_type ||
      !discount_value ||
      !start_date ||
      !end_date
    ) {
      return new Response(
        JSON.stringify({ message: "缺少必填欄位" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // 驗證日期格式
    const isValidDate = (dateStr) => {
      if (!dateStr) return false;
      const date = new Date(dateStr);
      return !Number.isNaN(date.valueOf());
    };

    if (!isValidDate(start_date)) {
      return new Response(
        JSON.stringify({ message: "開始日期格式無效" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (!isValidDate(end_date)) {
      return new Response(
        JSON.stringify({ message: "結束日期格式無效" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    await db.query(
      `INSERT INTO coupons (name, coupon_code, discount_type, discount_value, min_purchase, max_discount, start_date, end_date, level_id, created_at, updated_at, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), 0)`,
      [
        name,
        coupon_code,
        discount_type,
        discount_value,
        min_purchase || null,
        max_discount || null,
        start_date,
        end_date,
        level_id || 1, // 預設等級為 1，如果未提供
      ]
    );

    return new Response(
      JSON.stringify({
        message: "新增優惠券成功",
        coupon: {
          name,
          coupon_code,
          discount_type,
          discount_value,
          min_purchase: min_purchase || null,
          max_discount: max_discount || null,
          start_date,
          end_date,
          level_id: level_id || 1,
          status: 0, // 預設為關閉狀態
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.log(error);
    return new Response(
      JSON.stringify({ message: "新增優惠券失敗" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}