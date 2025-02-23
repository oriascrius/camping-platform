import db from "@/lib/db";
import { lineMessaging } from "@/utils/lineMessaging";

export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const orderId = id;
    console.log("接收到的訂單編號:", orderId);

    // 移除 has_messaging_permission 欄位
    const [[userInfo]] = await db.execute(
      `
      SELECT 
        b.*,
        u.line_user_id,
        u.login_type,
        u.name as user_name
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      WHERE b.order_id = ?
    `,
      [orderId]
    );

    if (!userInfo) {
      console.log("找不到訂單資料，訂單編號:", orderId);
      return Response.json(
        { error: "找不到訂單資料" },
        { status: 404 }
      );
    }

    // 只檢查是否有 line_user_id
    if (!userInfo.line_user_id) {
      return Response.json({
        success: false,
        message: "此用戶未綁定 LINE，不需要發送通知"
      });
    }

    // 準備通知資料
    const notificationData = {
      bookingId: userInfo.booking_id,
      orderId: userInfo.order_id,
      userName: userInfo.user_name,
      amount: userInfo.total_price,
      status: userInfo.status,
      paymentStatus: userInfo.payment_status,
      paymentMethod: userInfo.payment_method,
      contactName: userInfo.contact_name,
      contactPhone: userInfo.contact_phone,
      quantity: userInfo.quantity,
      nights: userInfo.nights
    };

    // 發送 LINE 通知
    const sendResult = await lineMessaging.sendOrderUpdate(
      userInfo.line_user_id, 
      notificationData
    );

    // 根據發送結果返回
    if (sendResult) {
      return Response.json({ 
        success: true, 
        message: "LINE 通知發送成功",
        notificationData
      });
    } else {
      return Response.json({ 
        success: false, 
        message: "LINE 通知發送失敗，用戶可能未授權或封鎖訊息"
      });
    }

  } catch (error) {
    console.error("發送 LINE 通知失敗:", error);
    return Response.json({ error: "發送通知失敗" }, { status: 500 });
  }
}
