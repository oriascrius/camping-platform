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

      } catch (error) {
        console.error('訊息處理錯誤:', error);
        socket.emit('messageError', { 
          error: '訊息處理失敗',
          details: error.message 
        });
      }
    });

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