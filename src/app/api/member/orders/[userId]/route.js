import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request, { params }) {
  try {
    const { userId } = await params;

    // 查詢產品訂單
    const productQuery = `
      SELECT 
        po.order_id AS order_id,
        po.member_id,
        po.payment_status,
        po.order_status,
        po.created_at AS order_created_at,
        po.updated_at AS order_updated_at,
        po.delivery_method,
        po.payment_method,
        po.used_coupon,
        po.shipping_address,
        po.shipping_fee,
        po.recipient_name,
        po.recipient_phone,
        po.recipient_email,
        u.avatar,
        u.points,
        u.last_login,
        u.status AS user_status,
        u.created_at AS user_created_at,
        u.updated_at AS user_updated_at,
        u.login_type,
        pod.id AS order_detail_id,
        pod.product_id,
        pod.quantity,
        pod.price AS product_price,
        pod.created_at AS order_detail_created_at,
        p.name AS product_name,
        p.description AS product_description,
        p.price AS product_unit_price,
        p.stock AS product_stock,
        p.sort_order,
        p.status AS product_status,
        p.created_at AS product_created_at,
        p.updated_at AS product_updated_at,
        pi.image_path AS product_image,
        'product' AS order_type,
        NULL AS nights
      FROM product_orders po
      JOIN users u ON po.member_id = u.id
      JOIN product_order_details pod ON po.order_id = pod.order_id
      JOIN products p ON pod.product_id = p.id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_main = 1
      WHERE po.member_id = ?
    `;

    // 查詢營地/活動訂單 - 強化日期格式處理
    const campQuery = `
      SELECT 
        b.booking_id AS order_id,
        b.user_id AS member_id,
        b.payment_status,
        b.status AS order_status,
        b.booking_date AS order_created_at,
        b.updated_at AS order_updated_at,
        b.payment_method,
        '' AS delivery_method,
        '' AS used_coupon,
        '' AS shipping_address,
        0 AS shipping_fee,
        b.contact_name AS recipient_name,
        b.contact_phone AS recipient_phone,
        b.contact_email AS recipient_email,
        u.avatar,
        u.points,
        u.last_login,
        u.status AS user_status,
        u.created_at AS user_created_at,
        u.updated_at AS user_updated_at,
        u.login_type,
        b.booking_id AS order_detail_id,
        sa.activity_id AS product_id,
        b.quantity,
        b.total_price AS product_price,
        b.booking_date AS order_detail_created_at,
        sa.activity_name AS product_name,
        sa.description AS product_description,
        aso.price AS product_unit_price,
        aso.max_quantity AS product_stock,
        aso.sort_order,
        'active' AS product_status,
        sa.start_date AS start_date_original, 
        sa.end_date AS end_date_original,
        CASE 
            WHEN sa.start_date IS NULL OR sa.start_date = '0000-00-00' THEN NULL
            ELSE DATE_FORMAT(sa.start_date, '%Y-%m-%d')
        END AS product_created_at,
        CASE 
            WHEN sa.end_date IS NULL OR sa.end_date = '0000-00-00' THEN NULL
            ELSE DATE_FORMAT(sa.end_date, '%Y-%m-%d')
        END AS product_updated_at,
        sa.main_image AS product_image,
        'camp' AS order_type,
        IFNULL(b.nights, 1) AS nights
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN activity_spot_options aso ON b.option_id = aso.spot_id
      JOIN spot_activities sa ON aso.activity_id = sa.activity_id
      WHERE b.user_id = ?
    `;

    // 執行查詢
    const [productRows] = await db.execute(productQuery, [userId]);
    const [campRows] = await db.execute(campQuery, [userId]);

    // 合併結果
    const allRows = [...productRows, ...campRows];

    if (allRows.length === 0) {
      return NextResponse.json({ error: "沒有找到歷史訂單" }, { status: 404 });
    }

    // 將查詢結果轉換為所需的結構
    const orders = allRows.reduce((acc, row) => {
      const order = acc.find(
        (o) => o.order_id === row.order_id && o.order_type === row.order_type
      );

      const product = {
        product_id: row.product_id,
        name: row.product_name,
        description: row.product_description,
        unit_price: row.product_unit_price,
        quantity: row.quantity,
        price: row.product_price,
        image:
          row.order_type === "camp" ? row.product_image : row.product_image,
        type: row.order_type,
        product_created_at: row.product_created_at,
        product_updated_at: row.product_updated_at,
      };

      if (order) {
        order.products.push(product);
        order.total_amount += product.quantity * product.unit_price;
      } else {
        acc.push({
          order_id: row.order_id,
          member_id: row.member_id,
          total_amount: product.quantity * product.unit_price,
          payment_status: row.payment_status,
          order_status: row.order_status,
          order_created_at: row.order_created_at,
          order_updated_at: row.order_updated_at,
          delivery_method: row.delivery_method,
          payment_method: row.payment_method,
          used_coupon: row.used_coupon,
          shipping_address: row.shipping_address,
          shipping_fee: row.shipping_fee,
          recipient_name: row.recipient_name,
          recipient_phone: row.recipient_phone,
          recipient_email: row.recipient_email,
          avatar: row.avatar,
          last_login: row.last_login,
          user_status: row.user_status,
          user_created_at: row.user_created_at,
          user_updated_at: row.user_updated_at,
          login_type: row.login_type,
          products: [product],
          order_type: row.order_type, // 添加訂單類型以區分來源
          nights: row.nights, // 確保nights值被正確保留
        });
      }

      return acc;
    }, []);

    // 按訂單日期排序
    orders.sort(
      (a, b) => new Date(b.order_created_at) - new Date(a.order_created_at)
    );

    return NextResponse.json(orders);
  } catch (error) {
    console.error("獲取歷史訂單失敗:", error);
    return NextResponse.json({ error: "獲取歷史訂單失敗" }, { status: 500 });
  }
}

// POST 方法保持不變
export async function POST(req) {
  // 現有的實現保持不變
}
