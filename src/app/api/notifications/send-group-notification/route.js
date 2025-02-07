import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import pool from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

// 群發通知的專用路由（群發系統通知）
export async function POST(req) {
  try {
    // 檢查管理員權限
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    const { targetRole, type, title, content } = await req.json();
    console.log("收到的請求數據:", { targetRole, type, title, content });

    // 根據目標角色獲取用戶ID
    let targetUsers = [];
    try {
      if (targetRole === "user" || targetRole === "all") {
        const [users] = await pool.execute(
          "SELECT id FROM users WHERE status = 1"
        );
        console.log("獲取到的用戶:", users);
        targetUsers = [...targetUsers, ...users];
      }

      if (targetRole === "owner" || targetRole === "all") {
        const [owners] = await pool.execute(
          "SELECT id FROM owners WHERE status = 1"
        );
        console.log("獲取到的營地主:", owners);
        targetUsers = [...targetUsers, ...owners];
      }
    } catch (dbError) {
      console.error("查詢用戶時出錯:", dbError);
      return NextResponse.json(
        { error: "查詢用戶失敗", details: dbError.message },
        { status: 500 }
      );
    }

    console.log("目標用戶數量:", targetUsers.length);

    // 批量插入通知
    if (targetUsers.length > 0) {
      try {
        const values = targetUsers.map((user) => [
          uuidv4(),
          user.id,
          type,
          title,
          content,
          0,
          new Date(),
        ]);

        console.log("準備插入的數據:", values);

        const [result] = await pool.execute(
          `INSERT INTO notifications 
           (id, user_id, type, title, content, is_read, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          values[0]
        );

        // 如果單行插入成功，再使用循環插入其餘數據
        if (values.length > 1) {
          for (let i = 1; i < values.length; i++) {
            await pool.execute(
              `INSERT INTO notifications 
               (id, user_id, type, title, content, is_read, created_at) 
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              values[i]
            );
          }
        }

        console.log("插入結果:", result);

        // 如果有 WebSocket 連接，發送即時通知
        const io = global.io;
        if (io) {
          targetUsers.forEach((user) => {
            io.to(`notification_${user.id}`).emit("newNotification", {
              type,
              title,
              content,
              created_at: new Date(),
            });
          });
        }
      } catch (insertError) {
        console.error("插入通知時出錯:", insertError);
        return NextResponse.json(
          { error: "插入通知失敗", details: insertError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      count: targetUsers.length,
    });
  } catch (error) {
    console.error("發送群組通知失敗:", error);
    console.error("錯誤詳情:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    return NextResponse.json(
      { error: "發送通知失敗", details: error.message },
      { status: 500 }
    );
  }
}
