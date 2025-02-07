const pool = require('./models/connection');
const { v4: uuidv4 } = require('uuid');

function initializeWebSocket(io) {
  // 儲存管理員的連接
  const adminSockets = new Map();

  io.on('connection', async (socket) => {
    console.log('=== 新用戶連接 ===');
    console.log('Socket ID:', socket.id);
    console.log('連接參數:', socket.handshake.query);
    
    const { userId, userType, roomId } = socket.handshake.query;
    console.log('解析參數:', { userId, userType, roomId });

    // 如果是管理員連接
    if (userType === 'admin') {
      console.log('管理員連接:', userId);
      adminSockets.set(userId, socket);
      
      // 加入所有活動聊天室
      const [rooms] = await pool.execute(
        'SELECT id FROM chat_rooms WHERE status = "active"'
      );
      rooms.forEach(room => {
        socket.join(room.id);
      });
    }

    // 加入個人通知頻道
    // if (userId) {
    //   socket.join(`notification_${userId}`);
    // }

    // 處理加入房間
    socket.on('joinRoom', async (data) => {
      try {
        console.log('用戶加入房間:', data);
        await socket.join(data.roomId);

        // 如果是管理員加入，重置未讀數
        if (data.userType === 'admin') {
          await pool.execute(
            `UPDATE chat_rooms 
             SET unread_count = 0
             WHERE id = ?`,
            [data.roomId]
          );
        }

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
          [data.roomId]
        );

        socket.emit('chatHistory', messages);
      } catch (error) {
        console.error('加入房間錯誤:', error);
      }
    });

    // 發送通知的函數
    // async function sendNotification({ userId, type, title, content }) {
    //   try {
    //     const notificationId = uuidv4();
        
    //     // 儲存通知到資料庫
    //     await pool.execute(
    //       `INSERT INTO notifications 
    //        (id, user_id, type, title, content) 
    //        VALUES (?, ?, ?, ?, ?)`,
    //       [notificationId, userId, type, title, content]
    //     );

    //     // 即時發送通知
    //     io.to(`notification_${userId}`).emit('newNotification', {
    //       id: notificationId,
    //       type,
    //       title,
    //       content,
    //       created_at: new Date()
    //     });

    //     return notificationId;
    //   } catch (error) {
    //     console.error('發送通知錯誤:', error);
    //     throw error;
    //   }
    // }

    // 處理訊息
    socket.on('message', async (data) => {
      try {
        const messageId = uuidv4();
        console.log('收到訊息:', data);

        // 根據發送者類型設置名稱
        let senderName;
        if (data.senderType === 'admin') {
          const [adminResult] = await pool.execute(
            'SELECT name FROM admins WHERE id = ?',
            [data.userId]
          );
          senderName = adminResult[0]?.name || '客服人員';
        } else {
          const [userResult] = await pool.execute(
            'SELECT name FROM users WHERE id = ?',
            [data.userId]
          );
          senderName = userResult[0]?.name || '會員';
        }

        // 建立完整的訊息資料
        const messageData = {
          id: messageId,
          roomId: data.roomId,
          message: data.message,
          sender_type: data.senderType,
          sender_name: senderName,
          created_at: new Date().toISOString(),
          user_id: data.userId
        };

        // 廣播訊息
        io.to(data.roomId).emit('message', messageData);

        // 儲存訊息到資料庫
        await Promise.all([
          // 插入訊息
          pool.execute(
            `INSERT INTO chat_messages 
             (id, room_id, user_id, message, sender_type, message_type, status, created_at) 
             VALUES (?, ?, ?, ?, ?, 'text', 'sent', NOW())`,
            [messageId, data.roomId, data.userId, data.message, data.senderType]
          ),
          // 更新聊天室最後訊息（移除 last_sender_type）
          pool.execute(
            `UPDATE chat_rooms 
             SET last_message = ?,
                 last_message_time = NOW()
             WHERE id = ?`,
            [data.message, data.roomId]
          )
        ]);

        console.log('訊息已儲存並廣播');

        // 如果是會員發送給管理員
        // if (data.senderType === 'member') {
        //   // 發送通知給所有在線管理員
        //   adminSockets.forEach((adminSocket, adminId) => {
        //     sendNotification({
        //       userId: adminId,
        //       type: 'message',
        //       title: '新的客服訊息',
        //       content: `會員 ${senderName} 傳送了一則新訊息: ${data.message.substring(0, 50)}...`
        //     });
        //   });
        // }
        // // 如果是管理員發送給會員
        // else if (data.senderType === 'admin') {
        //   sendNotification({
        //     userId: data.recipientId, // 接收訊息的會員 ID
        //     type: 'message',
        //     title: '新的客服回覆',
        //     content: `客服人員回覆了您的訊息: ${data.message.substring(0, 50)}...`
        //   });
        // }

      } catch (error) {
        console.error('訊息處理錯誤:', error);
        socket.emit('messageError', { 
          error: '訊息處理失敗',
          details: error.message 
        });
      }
    });

    // 標記通知為已讀
    // socket.on('markNotificationRead', async (notificationId) => {
    //   try {
    //     await pool.execute(
    //       `UPDATE notifications 
    //        SET is_read = TRUE 
    //        WHERE id = ? AND user_id = ?`,
    //       [notificationId, userId]
    //     );

    //     socket.emit('notificationMarkedRead', notificationId);
    //   } catch (error) {
    //     console.error('標記通知已讀錯誤:', error);
    //   }
    // });

    // 獲取未讀通知數量
    // socket.on('getUnreadNotificationCount', async () => {
    //   try {
    //     const [result] = await pool.execute(
    //       `SELECT COUNT(*) as count 
    //        FROM notifications 
    //        WHERE user_id = ? AND is_read = FALSE`,
    //       [userId]
    //     );

    //     socket.emit('unreadNotificationCount', result[0].count);
    //   } catch (error) {
    //     console.error('獲取未讀通知數量錯誤:', error);
    //   }
    // });

    // 獲取通知列表
    // socket.on('getNotifications', async (page = 1, limit = 10) => {
    //   try {
    //     const offset = (page - 1) * limit;
    //     const [notifications] = await pool.execute(
    //       `SELECT * FROM notifications 
    //        WHERE user_id = ? 
    //        ORDER BY created_at DESC 
    //        LIMIT ? OFFSET ?`,
    //       [userId, limit, offset]
    //     );

    //     socket.emit('notificationList', notifications);
    //   } catch (error) {
    //     console.error('獲取通知列表錯誤:', error);
    //   }
    // });

    socket.on('disconnect', () => {
      console.log('用戶斷開連接:', socket.id);
      // 如果是管理員斷開連接，從 Map 中移除
      if (userType === 'admin') {
        adminSockets.delete(userId);
      }
    });
  });

  return io;
}

module.exports = initializeWebSocket;