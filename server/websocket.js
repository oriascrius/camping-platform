const { v4: uuidv4 } = require('uuid');

function initializeWebSocket(io, db) {
  io.on('connection', async (socket) => {
    console.log('=== 新用戶連接 ===');
    console.log('Socket ID:', socket.id);
    console.log('連接參數:', socket.handshake.query);
    
    const { userId, userType, roomId } = socket.handshake.query;
    console.log('解析參數:', { userId, userType, roomId });

    // 處理加入房間
    socket.on('joinRoom', async (data) => {
      try {
        console.log('加入房間資料:', data);
        
        if (!data.roomId || !data.userId || !data.userType) {
          console.error('缺少必要參數:', data);
          throw new Error('缺少必要參數');
        }

        // 檢查房間是否存在，不存在則創建
        const [rooms] = await db.execute(
          'SELECT id FROM chat_rooms WHERE id = ?',
          [data.roomId]
        );

        if (rooms.length === 0) {
          // 創建新房間，包含所有必要欄位
          await db.execute(
            `INSERT INTO chat_rooms (
              id, 
              name, 
              status, 
              created_at,
              updated_at,
              admin_id,
              user_id,
              last_message,
              last_message_time,
              unread_count
            ) VALUES (?, ?, ?, NOW(), NOW(), ?, ?, NULL, NULL, 0)`,
            [
              data.roomId,
              `用戶 ${data.userId} 的聊天室`,  // 設置預設聊天室名稱
              'active',
              null,  // admin_id 初始為 null
              data.userId
            ]
          );
          console.log('創建新聊天室:', data.roomId);
        }

        await socket.join(data.roomId);
        console.log(`用戶 ${data.userId} 成功加入房間 ${data.roomId}`);

        // 取得歷史訊息
        const [messages] = await db.execute(
          'SELECT * FROM chat_messages WHERE room_id = ? ORDER BY created_at ASC',
          [data.roomId]
        );

        // 發送歷史訊息
        socket.emit('chatHistory', messages);
        
      } catch (error) {
        console.error('加入房間錯誤:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // 處理訊息
    socket.on('message', async (data) => {
      try {
        console.log('收到訊息:', data);
        
        const messageId = uuidv4();
        const currentTime = new Date().toISOString();

        // 插入新訊息
        await db.execute(
          `INSERT INTO chat_messages 
           (id, room_id, user_id, sender_type, message, message_type, status, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
          [messageId, data.roomId, data.userId, data.senderType, data.message, 'text', 'sent']
        );

        // 更新聊天室的最後訊息
        await db.execute(
          `UPDATE chat_rooms 
           SET last_message = ?,
               last_message_time = NOW(),
               unread_count = unread_count + 1
           WHERE id = ?`,
          [data.message, data.roomId]
        );

        const messageData = {
          id: messageId,
          room_id: data.roomId,
          user_id: data.userId,
          sender_type: data.senderType,
          message: data.message,
          message_type: 'text',
          status: 'sent',
          created_at: currentTime
        };

        // 修正：根據發送者類型發送正確的事件
        if (data.senderType === 'member') {
          io.to(data.roomId).emit('memberMessage', messageData);
        } else {
          io.to(data.roomId).emit('adminMessage', messageData);
        }
        
        // 發送未讀計數更新
        io.to(data.roomId).emit('unreadCount', {
          roomId: data.roomId,
          count: await getUnreadCount(data.roomId)
        });
        
      } catch (error) {
        console.error('訊息處理錯誤:', error);
        socket.emit('error', { message: '訊息發送失敗' });
      }
    });

    socket.on('disconnect', () => {
      console.log('用戶斷開連接:', socket.id);
    });
  });
}

// 獲取未讀數量的輔助函數
async function getUnreadCount(roomId) {
  const [rows] = await db.execute(
    `SELECT COUNT(*) as count 
     FROM chat_messages 
     WHERE room_id = ? 
     AND status = 'sent'`,
    [roomId]
  );
  return rows[0].count;
}

module.exports = initializeWebSocket;