const pool = require("../models/connection");
const { v4: uuidv4 } = require("uuid");

function initializeChatHandler(io, socket, connections) {
  const { userId, userType } = socket.handshake.query;
  let isInitialized = false;  // 防止重複初始化

  // 如果是管理員，自動加入所有活動聊天室
  if (userType === "admin") {
    (async () => {
      try {
        // 獲取所有活動中的聊天室
        const [rooms] = await pool.execute(
          'SELECT id FROM chat_rooms WHERE status = "active"'
        );
        rooms.forEach((room) => {
          socket.join(room.id);
        });

        // 獲取聊天室列表（包含最後訊息和未讀數）
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
              AND cm.sender_type = 'member'
            ) as unread_count
          FROM chat_rooms cr
          LEFT JOIN users u ON cr.user_id = u.id
          LEFT JOIN admins a ON cr.admin_id = a.id
          WHERE cr.status = 'active'
          ORDER BY 
            CASE 
              WHEN cr.last_message_time IS NULL THEN 1 
              ELSE 0 
            END,
            cr.last_message_time DESC
        `);

        socket.emit("chatRooms", chatRooms);
      } catch (error) {
        console.error("管理員初始化聊天室失敗:", error);
        socket.emit("error", { message: "初始化聊天室失敗" });
      }
    })();
  }

  // 初始化聊天室
  async function initializeChat(data) {
    if (isInitialized) return;  // 如果已初始化，直接返回
    
    try {
      console.log("初始化聊天室:", data);
      const roomId = data.roomId || `chat_${data.userId}`;
      
      // 查詢或創建聊天室
      const [room] = await pool.execute(
        `SELECT c.*, 
          COALESCE(u.name, o.name) as user_name,
          a.name as admin_name
         FROM chat_rooms c
         LEFT JOIN users u ON c.user_id = u.id
         LEFT JOIN owners o ON c.user_id = o.id
         LEFT JOIN admins a ON c.admin_id = a.id
         WHERE c.id = ?`,
        [roomId]
      );

      if (room.length > 0) {
        console.log("聊天室初始化成功:", { roomId, room: room[0] });
        socket.emit("chatInitialized", room[0]);
        isInitialized = true;  // 標記為已初始化
      }

    } catch (error) {
      console.error("聊天室初始化失敗:", error);
    }
  }

  // 加入聊天室並獲取歷史訊息
  socket.on("joinRoom", async (data) => {
    try {
      await socket.join(data.roomId);

      // 獲取歷史訊息
      const [messages] = await pool.execute(`
        SELECT 
          cm.*,
          CASE 
            WHEN cm.sender_type = 'member' THEN u.name
            WHEN cm.sender_type = 'admin' THEN a.name
          END as sender_name
        FROM chat_messages cm
        LEFT JOIN users u ON cm.sender_id = u.id AND cm.sender_type = 'member'
        LEFT JOIN admins a ON cm.sender_id = a.id AND cm.sender_type = 'admin'
        WHERE cm.room_id = ?
        ORDER BY cm.created_at ASC`,
        [data.roomId]
      );

      socket.emit("chatHistory", messages);
    } catch (error) {
      console.error("獲取聊天記錄失敗:", error);
      socket.emit("error", { message: "獲取聊天記錄失敗" });
    }
  });

  // 處理訊息發送
  socket.on("sendMessage", async (data) => {
    try {
      console.log("接收到的訊息:", data);
      
      // 確保管理員 ID 正確
      const senderId = userType === "admin" 
        ? socket.handshake.query.adminId || 1  // 使用管理員 ID，預設為 1
        : userId;

      const messageData = {
        id: data.messageId,
        room_id: data.roomId,
        sender_id: parseInt(senderId),  // 確保是數字
        sender_type: data.senderType,
        sender_name: userType === "admin" ? "客服人員" : null,
        message: data.message,
        message_type: "text",
        status: "sent"
      };

      const connection = await pool.getConnection();
      await connection.beginTransaction();

      // 儲存訊息
      await connection.execute(
        `INSERT INTO chat_messages 
         (id, room_id, sender_id, sender_type, message, message_type, status, created_at) 
         VALUES (?, ?, ?, ?, ?, 'text', 'sent', NOW())`,
        [messageData.id, messageData.room_id, messageData.sender_id, messageData.sender_type, messageData.message]
      );

      // 更新聊天室最後訊息
      await connection.execute(
        `UPDATE chat_rooms 
         SET last_message = ?,
             last_message_time = NOW(),
             admin_id = CASE 
               WHEN admin_id IS NULL AND ? = 'admin' 
               THEN ? 
               ELSE admin_id 
             END
         WHERE id = ?`,
        [messageData.message, messageData.sender_type, messageData.sender_id, messageData.room_id]
      );

      await connection.commit();

      // 廣播訊息到聊天室
      io.to(messageData.room_id).emit("message", messageData);

      // 更新聊天室列表
      if (messageData.sender_type === 'admin') {
        io.emit("updateChatRooms");
      }

      // 發送成功回應
      socket.emit("messageSent", { 
        success: true, 
        messageId: messageData.id,
        messageData 
      });

      console.log("訊息發送成功:", messageData);

    } catch (error) {
      await connection.rollback();
      console.error("訊息處理失敗:", error);
      socket.emit("messageError", {
        error: "訊息處理失敗",
        details: error.message
      });
    } finally {
      connection.release();
    }
  });

  // 處理標記已讀
  socket.on("markMessagesAsRead", async (data) => {
    const connection = await pool.getConnection();
    try {
      const { roomId, userId } = data;
      const currentTime = new Date().toISOString().slice(0, 19).replace('T', ' ');

      // 更新訊息的已讀狀態
      await connection.execute(
        `UPDATE chat_messages 
         SET status = 'read',
             read_at = ?
         WHERE room_id = ? 
         AND sender_type = 'member'
         AND status != 'read'`,
        [currentTime, roomId]
      );

      // 發送更新事件
      io.to(roomId).emit("messagesRead", {
        roomId,
        readAt: currentTime
      });

      // 更新聊天室列表
      io.emit("updateChatRooms");

    } catch (error) {
      console.error("標記已讀錯誤:", error);
      socket.emit("error", {
        message: "標記已讀失敗"
      });
    } finally {
      connection.release();
    }
  });

  // 獲取聊天室狀態
  socket.on("getChatRoomStatus", async (data) => {
    try {
      const [result] = await pool.execute(`
        SELECT 
          cr.status,
          (
            SELECT COUNT(*) 
            FROM chat_messages cm 
            WHERE cm.room_id = cr.id 
            AND cm.status = 'sent'
            AND cm.sender_type != ?
          ) as unread_count
        FROM chat_rooms cr
        WHERE cr.id = ?`,
        [data.userType, data.roomId]
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
        roomId: data.roomId
      });
    } catch (error) {
      socket.emit("error", { message: "關閉聊天室失敗" });
    }
  });

  // 初始化聊天室
  if (socket.handshake.query.chatRoomId) {
    initializeChat({
      roomId: socket.handshake.query.chatRoomId,
      userId,
      userType
    });
  }
}

module.exports = initializeChatHandler;
