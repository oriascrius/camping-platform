const pool = require("./models/connection");
const { v4: uuidv4 } = require("uuid");

// 在檔案開頭添加一個 Map 來追蹤處理中的請求
const pendingRequests = new Map();

// 在檔案開頭添加
const activeInitializations = new Set();

function initializeWebSocket(io) {
  // 儲存管理員的連接
  const adminSockets = new Map();
  // 儲存會員的連接
  const memberSockets = new Map();
  // 儲存營主的連接
  const ownerSockets = new Map();

  io.on("connection", async (socket) => {
    // 添加錯誤處理
    socket.on("error", (error) => {
      console.error("Socket error:", error);
    });

    socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
    });

    // 添加重連邏輯
    socket.on("reconnect", (attemptNumber) => {
      console.log("Reconnected after", attemptNumber, "attempts");
    });

    socket.on("reconnect_error", (error) => {
      console.error("Reconnection error:", error);
    });

    // 取得用戶的 id、類型、房間 id 和是否是新的 session
    const { userId, userType, roomId, isNewSession } = socket.handshake.query;

    // 處理用戶登入通知
    if ((userType === "member" || userType === "owner") && isNewSession === 'true') {
      try {
        // 獲取用戶的上次登入時間
        const userTable = userType === "member" ? "users" : "owners";
        const [lastLoginResult] = await pool.execute(
          `SELECT last_login FROM ${userTable} WHERE id = ?`,
          [userId]
        );

        const lastLogin = lastLoginResult[0]?.last_login;
        const lastLoginStr = lastLogin 
          ? new Date(lastLogin).toLocaleString('zh-TW', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            })
          : '首次登入';

        // 生成歡迎通知
        const welcomeNotification = {
          id: uuidv4(),
          user_id: userId,
          type: 'system',
          title: '歡迎回來',
          content: lastLogin 
            ? `哈囉！好久不見～ 上次見到你是 ${lastLoginStr} 呢！`
            : '耶！歡迎加入我們的露營大家庭 🏕️',
          is_read: false,
          created_at: new Date()
        };

        // 儲存通知到資料庫
        await pool.execute(
          `INSERT INTO notifications 
           (id, user_id, type, title, content, is_read, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, NOW())`,
          [
            welcomeNotification.id,
            userId,
            welcomeNotification.type,
            welcomeNotification.title,
            welcomeNotification.content,
            0
          ]
        );

        // 即時發送通知給用戶
        socket.emit("newNotification", welcomeNotification);

        // 更新用戶的最後登入時間
        await pool.execute(
          `UPDATE ${userTable} SET last_login = NOW() WHERE id = ?`,
          [userId]
        );

      } catch (error) {
        console.error("發送登入通知失敗:", error);
      }
    }

    // 儲存用戶連接
    if (userType === "admin") {
      adminSockets.set(userId, socket);

      // 加入所有活動聊天室
      const [rooms] = await pool.execute(
        'SELECT id FROM chat_rooms WHERE status = "active"'
      );
      rooms.forEach((room) => {
        socket.join(room.id);
      });

      // 直接發送聊天室列表
      try {
        const [chatRooms] = await pool.execute(`
          SELECT 
            cr.*,
            u.name as user_name,
            a.name as admin_name,
            (
              SELECT COUNT(*) 
              FROM chat_messages cm 
              WHERE cm.room_id = cr.id 
              AND cm.status = 'sent'
            ) as unread_count
          FROM chat_rooms cr
          LEFT JOIN users u ON cr.user_id = u.id
          LEFT JOIN admins a ON cr.admin_id = a.id
          WHERE cr.status = 'active'
          ORDER BY cr.last_message_time DESC
        `);

        socket.emit("chatRooms", chatRooms);
      } catch (error) {
        console.error("主動獲取聊天室列表失敗:", error);
        socket.emit("error", { message: "獲取聊天室列表失敗" });
        socket.emit("chatRooms", []);
      }
    } else if (userType === "member") {
      memberSockets.set(userId, socket);
    } else if (userType === "owner") {
      ownerSockets.set(userId, socket);
    }

    // 獲取聊天室列表事件監聽
    socket.on("getChatRooms", async () => {
      try {
        const [chatRooms] = await pool.execute(`
          SELECT 
            cr.*,
            u.name as user_name,
            u.email as user_email,
            a.name as admin_name,
            (
              SELECT COUNT(*) 
              FROM chat_messages cm 
              WHERE cm.room_id = cr.id 
              AND cm.status = 'sent'
            ) as unread_count
          FROM chat_rooms cr
          LEFT JOIN users u ON cr.user_id = u.id
          LEFT JOIN admins a ON cr.admin_id = a.id
          WHERE cr.status = "active"
          ORDER BY 
            CASE 
              WHEN cr.last_message_time IS NULL THEN 1 
              ELSE 0 
            END,
            cr.last_message_time DESC
        `);

        socket.emit("chatRooms", chatRooms);
      } catch (error) {
        console.error("獲取聊天室列表失敗:", error);
        socket.emit("error", { message: "獲取聊天室列表失敗" });
        socket.emit("chatRooms", []);
      }
    });

    // 加入聊天室並獲取歷史訊息
    socket.on("joinRoom", async (data) => {
      try {
        const { roomId, userId } = data;
        console.log('加入聊天室:', { roomId, userId });

        // 加入 Socket.io 房間
        await socket.join(roomId);

        // 取得歷史訊息
        const [messages] = await pool.execute(
          `SELECT 
            cm.*,
            CASE 
              WHEN cm.sender_type = 'member' THEN u.name
              WHEN cm.sender_type = 'admin' THEN a.name
            END as sender_name
           FROM chat_messages cm
           LEFT JOIN users u ON cm.user_id = u.id AND cm.sender_type = 'member'
           LEFT JOIN admins a ON cm.user_id = a.id AND cm.sender_type = 'admin'
           WHERE cm.room_id = ?
           ORDER BY cm.created_at ASC`,
          [roomId]
        );

        console.log('歷史訊息數量:', messages.length);

        // 發送歷史訊息給客戶端
        socket.emit('chatHistory', messages);
      } catch (error) {
        console.error('加入聊天室錯誤:', error);
        socket.emit('error', { message: '加入聊天室失敗' });
      }
    });

    // 標記訊息已讀
    socket.on("markMessagesAsRead", async (data) => {
      try {
        // 更新訊息狀態
        await pool.execute(
          `UPDATE chat_messages 
           SET status = 'read', 
               read_at = NOW() 
           WHERE room_id = ? 
           AND status = 'sent'`,
          [data.roomId]
        );

        // 不需要更新 chat_rooms 表的 unread_count
        // 因為我們可以在查詢時動態計算

        socket.emit("messagesMarkedAsRead", { success: true });

        // 重新獲取並廣播更新後的聊天室列表
        const [chatRooms] = await pool.execute(`
          SELECT 
            cr.*,
            u.name as user_name,
            u.email as user_email,
            a.name as admin_name,
            (
              SELECT COUNT(*) 
              FROM chat_messages cm 
              WHERE cm.room_id = cr.id 
              AND cm.status = 'sent'
            ) as unread_count
          FROM chat_rooms cr
          LEFT JOIN users u ON cr.user_id = u.id
          LEFT JOIN admins a ON cr.admin_id = a.id
          WHERE cr.status = "active"
          ORDER BY 
            CASE 
              WHEN cr.last_message_time IS NULL THEN 1 
              ELSE 0 
            END,
            cr.last_message_time DESC
        `);

        // 發送更新後的聊天室列表
        socket.emit("chatRooms", chatRooms);
      } catch (error) {
        console.error("更新已讀狀態失敗:", error);
        socket.emit("error", { message: "更新已讀狀態失敗" });
      }
    });

    // 獲取聊天室狀態
    socket.on("getChatRoomStatus", async (data) => {
      try {
        const [result] = await pool.execute(
          `SELECT status, unread_count 
           FROM chat_rooms 
           WHERE id = ?`,
          [data.roomId]
        );

        socket.emit("chatRoomStatus", result[0]);
      } catch (error) {
        socket.emit("error", { message: "獲取聊天室狀態失敗" });
      }
    });

    // 關閉聊天室
    socket.on("closeChatRoom", async (data) => {
      try {
        await pool.execute(
          `UPDATE chat_rooms 
           SET status = 'closed' 
           WHERE id = ?`,
          [data.roomId]
        );

        io.to(data.roomId).emit("chatRoomClosed", {
          roomId: data.roomId,
        });
      } catch (error) {
        socket.emit("error", { message: "關閉聊天室失敗" });
      }
    });

    // 處理獲取通知列表請求
    socket.on("getNotifications", async () => {
      try {
        const userId = socket.handshake.query.userId;

        const [notifications] = await pool.execute(
          `SELECT * FROM notifications 
           WHERE user_id = ? 
           AND is_deleted = 0 
           ORDER BY created_at DESC`,
          [userId]
        );

        socket.emit("notifications", notifications);
      } catch (error) {
        console.error("獲取通知列表失敗:", error);
        socket.emit("error", { message: "獲取通知列表失敗" });
      }
    });

    // 處理標記所有通知為已讀
    socket.on("markAllAsRead", async () => {
      try {
        await pool.execute(
          `UPDATE notifications 
           SET is_read = TRUE 
           WHERE user_id = ? AND is_read = FALSE`,
          [userId]
        );
      } catch (error) {
        console.error("標記通知已讀錯誤:", error);
      }
    });

    // 獲取通知類型列表
    socket.on("getNotificationTypes", () => {
      const types = [
        { value: "system", label: "系統通知" },
        { value: "message", label: "訊息通知" },
        { value: "alert", label: "提醒通知" },
      ];
      socket.emit("notificationTypes", types);
    });

    // 獲取啟用的會員列表
    socket.on("getUsers", async () => {
      try {
        const [users] = await pool.execute(`
          SELECT 
            id,
            name,
            email,
            phone,
            status,
            DATE_FORMAT(last_login, '%Y-%m-%d %H:%i:%s') as last_login,
            DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at
          FROM users 
          WHERE status = 1 
          ORDER BY created_at DESC
        `);

        // 將結果轉換為所需格式
        const formattedUsers = users.map((user) => ({
          ...user,
          id: user.id.toString(),
        }));

        socket.emit("usersList", formattedUsers);
      } catch (error) {
        console.error("獲取會員列表失敗:", error);
        socket.emit("error", {
          message: "獲取會員列表失敗",
          details: error.message,
        });
      }
    });

    // 獲取啟用的營主列表
    socket.on("getOwners", async () => {
      try {
        const [owners] = await pool.execute(`
          SELECT 
            id,
            name,
            email,
            company_name,
            phone,
            status,
            DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at
          FROM owners 
          WHERE status = 1 
          ORDER BY created_at DESC
        `);

        // 將結果轉換為所需格式
        const formattedOwners = owners.map((owner) => ({
          ...owner,
          id: owner.id.toString(),
        }));

        socket.emit("ownersList", formattedOwners);
      } catch (error) {
        console.error("獲取營主列表失敗:", error);
        socket.emit("error", {
          message: "獲取營主列表失敗",
          details: error.message,
        });
      }
    });

    // 獲取所有啟用的用戶
    socket.on("getAllUsers", async () => {
      try {
        const [users] = await pool.execute(
          `SELECT id, name, email, phone, 'user' as type 
           FROM users WHERE status = 1`
        );
        const [owners] = await pool.execute(
          `SELECT id, name, email, phone, 'owner' as type 
           FROM owners WHERE status = 1`
        );
        socket.emit("allUsersList", [...users, ...owners]);
      } catch (error) {
        socket.emit("error", { message: "獲取用戶列表失敗" });
      }
    });

    // 發送群組通知
    socket.on("sendGroupNotification", async (data) => {
      try {
        const { targetRole, type, title, content, targetUsers } = data;

        // 驗證必填欄位
        if (!title || !content || !targetUsers?.length) {
          return socket.emit("error", { message: "缺少必要資料" });
        }

        // 驗證通知類型
        const validTypes = ["system", "message", "alert"];
        if (!validTypes.includes(type)) {
          return socket.emit("error", { message: "無效的通知類型" });
        }

        await Promise.all(
          targetUsers.map(async (userId) => {
            try {
              await pool.execute(
                `INSERT INTO notifications 
                 (id, user_id, type, title, content, is_read, created_at) 
                 VALUES (?, CAST(? AS CHAR), ?, ?, ?, ?, NOW())`, // 確保 user_id 被轉換為字串
                [uuidv4(), userId, type, title, content, 0]
              );
            } catch (err) {
              console.error(`插入通知失敗 (用戶 ${userId}):`, err);
              throw err;
            }
          })
        );

        // 向目標用戶發送即時通知
        targetUsers.forEach((userId) => {
          let recipientSocket;
          if (memberSockets.has(userId)) {
            recipientSocket = memberSockets.get(userId);
          } else if (ownerSockets.has(userId)) {
            recipientSocket = ownerSockets.get(userId);
          }

          if (recipientSocket) {
            recipientSocket.emit("newNotification", {
              type,
              title,
              content,
              created_at: new Date(),
            });
          } else {
          }
        });

        // 通知發送者成功

        socket.emit("notificationSent", { success: true });
      } catch (error) {
        console.error("發送通知錯誤:", error);
        socket.emit("error", {
          message: "發送通知失敗",
          details: error.message,
        });
      }
    });

    // 檢查聊天室
    socket.on('checkRoom', async (data) => {
      try {
        const { userId } = data;
        console.log('=== 檢查聊天室 ===', { userId });

        // 使用事務來確保一致性
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
          // 查詢是否存在該會員的活動中聊天室
          const [rooms] = await connection.execute(
            `SELECT id, created_at 
             FROM chat_rooms 
             WHERE user_id = ? AND status = 'active'
             ORDER BY created_at DESC
             FOR UPDATE`,  // 加鎖防止並發
            [userId]
          );
          
          console.log('查詢結果:', {
            roomCount: rooms.length,
            rooms: rooms.map(r => ({ id: r.id, created_at: r.created_at }))
          });
          
          let roomId;
          
          if (rooms.length > 0) {
            roomId = rooms[0].id;
            console.log('使用現有聊天室:', roomId);
          } else {
            // 創建新聊天室
            roomId = uuidv4();
            console.log('創建新聊天室:', roomId);
            
            await connection.execute(
              `INSERT INTO chat_rooms 
               (id, user_id, status, created_at, last_message_time) 
               VALUES (?, ?, 'active', NOW(), NOW())`,
              [roomId, userId]
            );
          }

          await connection.commit();
          
          // 加入聊天室
          socket.join(roomId);
          
          // 發送結果給客戶端
          socket.emit('roomCheck', {
            exists: rooms.length > 0,
            roomId: roomId
          });

          // 如果是新創建的聊天室，發送創建成功事件
          if (rooms.length === 0) {
            socket.emit('roomCreated', {
              success: true,
              roomId: roomId
            });
          }

          // 獲取並發送聊天歷史
          const [messages] = await pool.execute(
            `SELECT * FROM chat_messages 
             WHERE room_id = ? 
             ORDER BY created_at ASC`,
            [roomId]
          );
          socket.emit('chatHistory', messages);

        } catch (error) {
          await connection.rollback();
          throw error;
        } finally {
          connection.release();
        }
        
      } catch (error) {
        console.error('檢查聊天室錯誤:', error);
        socket.emit('error', { 
          message: '檢查聊天室失敗',
          details: error.message
        });
      }
    });

    // 處理訊息發送 (前台會員和後台管理員都會使用)
    socket.on("message", async (data) => {
      try {
        console.log('收到新訊息:', data);

        let roomId = data.roomId;

        // 如果是會員且沒有 roomId，則查找或創建聊天室
        if (data.senderType === 'member' && !roomId) {
          // 檢查是否存在聊天室
          const [existingRooms] = await pool.execute(
            'SELECT id FROM chat_rooms WHERE user_id = ? AND status = "active"',
            [data.userId]
          );
          console.log('現有聊天室查詢結果:', existingRooms);

          if (existingRooms.length === 0) {
            // 如果不存在聊天室，創建一個新的
            roomId = uuidv4();
            await pool.execute(
              `INSERT INTO chat_rooms 
               (id, user_id, status, name) 
               VALUES (?, ?, 'active', ?)`,
              [
                roomId,
                data.userId,
                `與會員 ${data.userId} 的對話`
              ]
            );
          } else {
            roomId = existingRooms[0].id;
          }
        }

        // 驗證聊天室是否存在
        const [verifyRoom] = await pool.execute(
          'SELECT id FROM chat_rooms WHERE id = ?',
          [roomId]
        );
        
        if (verifyRoom.length === 0) {
          throw new Error(`聊天室 ${roomId} 不存在`);
        }

        const messageId = uuidv4();

        // 根據發送者類型設置名稱
        let senderName;
        if (data.senderType === "admin") {
          // 後台管理員發送
          const [adminResult] = await pool.execute(
            "SELECT name FROM admins WHERE id = ?",
            [data.userId]
          );
          senderName = adminResult[0]?.name || "客服人員";
        } else {
          // 前台會員發送
          const [userResult] = await pool.execute(
            "SELECT name FROM users WHERE id = ?",
            [data.userId]
          );
          senderName = userResult[0]?.name || "會員";
        }

        // 建立訊息資料
        const messageData = {
          id: messageId,
          roomId: roomId,
          message: data.message,
          sender_type: data.senderType,
          sender_name: senderName,
          created_at: new Date().toISOString(),
          user_id: data.userId,
        };

        // 儲存訊息到資料庫
        await pool.execute(
          `INSERT INTO chat_messages 
           (id, room_id, user_id, message, sender_type, message_type, status) 
           VALUES (?, ?, ?, ?, ?, 'text', ?)`,
          [
            messageId,
            roomId,
            data.userId,
            data.message,
            data.senderType,
            data.senderType === 'member' ? 'sent' : 'read'
          ]
        );

        // 廣播訊息給聊天室內的所有人
        io.to(roomId).emit("message", messageData);

        // 更新聊天室的最後訊息
        await pool.execute(
          `UPDATE chat_rooms 
           SET last_message = ?,
               last_message_time = NOW()
           WHERE id = ?`,
          [data.message, roomId]
        );

      } catch (error) {
        console.error("訊息處理錯誤:", error);
        socket.emit("messageError", {
          error: "訊息處理失敗",
          details: error.message,
        });
      }
    });

    // 處理清空通知
    socket.on("clearNotifications", async () => {
      const userId = socket.handshake.query.userId;

      try {
        if (!userId) {
          console.error("未找到用戶ID");
          socket.emit("notificationsCleared", {
            success: false,
            message: "未找到用戶ID",
          });
          return;
        }

        // 1. 執行軟刪除

        const [updateResult] = await pool.execute(
          `UPDATE notifications 
           SET is_deleted = 1, 
               updated_at = CURRENT_TIMESTAMP 
           WHERE user_id = ? 
           AND is_deleted = 0`,
          [userId]
        );

        // 不管是否有更新記錄，都視為成功
        // 2. 重新獲取未刪除的通知列表

        const [notifications] = await pool.execute(
          `SELECT * FROM notifications 
           WHERE user_id = ? 
           AND is_deleted = 0 
           ORDER BY created_at DESC`,
          [userId]
        );

        // 3. 立即發送成功回應
        socket.emit("notificationsCleared", {
          success: true,
          message: "通知已清空",
        });

        // 4. 更新前端通知列表
        socket.emit("notifications", notifications);
      } catch (error) {
        console.error("清空通知時發生錯誤:", error);
        // 確保錯誤回應一定會發送
        socket.emit("notificationsCleared", {
          success: false,
          message: error.message || "清空通知失敗",
        });
      }
    });

    // 處理按類型標記已讀
    socket.on("markTypeAsRead", async (data) => {
      try {
        const { type, userId } = data;
        console.log('收到標記已讀請求:', { type, userId });  // 添加日誌

        // 執行 SQL 更新，將對應類型的未讀通知改為已讀
        const [result] = await pool.execute(  // 添加 [result] 解構
          `UPDATE notifications 
           SET is_read = 1, 
           updated_at = ? 
           WHERE user_id = ? 
           AND type = ?    
           AND is_read = 0 
           AND is_deleted = 0`,
          [new Date(), userId, type]
        );
        
        console.log(`用戶 ${userId} 將 ${type} 類型的通知標記為已讀`);
        console.log(`更新了 ${result.affectedRows} 條記錄`);

        // 重新獲取更新後的通知列表
        const [notifications] = await pool.execute(
          `SELECT * FROM notifications 
           WHERE user_id = ? 
           AND is_deleted = 0 
           ORDER BY created_at DESC`,
          [userId]
        );

        // 發送更新後的通知列表給客戶端
        socket.emit("notifications", notifications);

      } catch (error) {
        console.error("標記類型通知已讀失敗:", error);
        socket.emit("error", {
          message: "標記通知已讀失敗",
          details: error.message
        });
      }
    });

    // 處理斷開連接
    socket.on("disconnect", () => {
      const userId = socket.handshake.query.userId;
      if (userId) {
        const initKey = `${userId}_${socket.id}`;
        activeInitializations.delete(initKey);
      }
      if (userType === "admin") {
        adminSockets.delete(userId);
      } else if (userType === "member") {
        memberSockets.delete(userId);
      } else if (userType === "owner") {
        ownerSockets.delete(userId);
      }
    });
  });

  // 添加全局錯誤處理
  io.engine.on("connection_error", (err) => {
    console.error("Connection error:", err);
  });

  return io;
}

module.exports = initializeWebSocket;
