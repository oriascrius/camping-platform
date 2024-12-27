const pool = require('./models/connection');
const { v4: uuidv4 } = require('uuid');

function initializeWebSocket(io) {
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
          throw new Error('缺少必要參數');
        }

        // 先檢查房間是否存在
        const [rooms] = await pool.execute(
          'SELECT id FROM chat_rooms WHERE id = ?',
          [data.roomId]
        );

        // 只有當房間不存在時才創建
        if (rooms.length === 0) {
          try {
            console.log('創建新聊天室:', data.roomId);
            await pool.execute(
              `INSERT INTO chat_rooms (
                id, 
                name, 
                status, 
                user_id,
                created_at,
                updated_at
              ) VALUES (?, ?, 'active', ?, NOW(), NOW())`,
              [
                data.roomId,
                `用戶 ${data.userId} 的聊天室`,
                data.userId
              ]
            );
            console.log('聊天室創建成功');
          } catch (err) {
            // 如果是重複鍵值錯誤，忽略它
            if (err.code !== 'ER_DUP_ENTRY') {
              throw err;
            }
            console.log('聊天室已存在，繼續處理');
          }
        } else {
          console.log('聊天室已存在:', data.roomId);
        }

        // 加入房間
        await socket.join(data.roomId);
        console.log(`用戶 ${data.userId} 成功加入房間 ${data.roomId}`);

        // 取得歷史訊息
        const [messages] = await pool.execute(
          'SELECT * FROM chat_messages WHERE room_id = ? ORDER BY created_at ASC',
          [data.roomId]
        );

        // 發送歷史訊息
        socket.emit('chatHistory', messages);
        
      } catch (error) {
        console.error('加入房間錯誤:', error);
        // 即使有錯誤也不要中斷連接
        socket.emit('error', { 
          message: error.message,
          code: error.code 
        });
      }
    });

    // 處理訊息
    socket.on('message', async (data) => {
      try {
        console.log('收到訊息:', data);
        const { userId, message, senderType, roomId } = data;

        const messageId = uuidv4();
        
        // 儲存訊息
        await pool.execute(
          `INSERT INTO chat_messages 
           (id, room_id, user_id, sender_type, message, message_type, status, created_at) 
           VALUES (?, ?, ?, ?, ?, 'text', 'sent', NOW())`,
          [messageId, roomId, userId, senderType, message]
        );

        // 更新聊天室最後訊息
        await pool.execute(
          `UPDATE chat_rooms 
           SET last_message = ?,
               last_message_time = NOW(),
               unread_count = unread_count + 1
           WHERE id = ?`,
          [message, roomId]
        );

        // 廣播訊息
        const messageData = {
          id: messageId,
          room_id: roomId,
          user_id: userId,
          message,
          sender_type: senderType,
          message_type: 'text',
          status: 'sent',
          created_at: new Date()
        };

        io.to(roomId).emit('message', messageData);
        console.log('訊息發送成功');

      } catch (error) {
        console.error('訊息處理錯誤:', error);
        socket.emit('messageError', { 
          error: '訊息發送失敗',
          details: error.message 
        });
      }
    });

    socket.on('disconnect', () => {
      console.log('用戶斷開連接:', socket.id);
    });
  });

  return io;
}

module.exports = initializeWebSocket;