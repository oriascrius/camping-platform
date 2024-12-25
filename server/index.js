require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const db = require('./models/connection');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      process.env.NEXT_PUBLIC_FRONTEND_URL
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

io.on('connection', async (socket) => {
  console.log('✅ 新用戶連接 - Socket ID:', socket.id);

  // 當用戶連接時，先創建/獲取聊天室
  socket.on('joinRoom', async ({ userId }) => {
    try {
      // 驗證用戶 ID 是否有效
      const [user] = await db.execute(
        'SELECT id, name FROM users WHERE id = ?',
        [userId]
      );

      if (user.length === 0) {
        throw new Error('無效的用戶ID');
      }

      // 檢查是否已有進行中的聊天室
      const [existingRooms] = await db.execute(
        `SELECT id, admin_id 
         FROM chat_rooms 
         WHERE user_id = ? 
         AND status = 'active'`,
        [userId]
      );

      let roomId;
      
      if (existingRooms.length > 0) {
        roomId = existingRooms[0].id;
        console.log(`使用現有聊天室: ${roomId} (用戶: ${userId})`);
      } else {
        roomId = `user_${userId}`;
        
        // 查找在線的客服管理員
        const [availableAdmins] = await db.execute(
          `SELECT id 
           FROM admins 
           WHERE status = 1 
           AND role = 1 
           ORDER BY login_at DESC 
           LIMIT 1`
        );

        const adminId = availableAdmins.length > 0 ? availableAdmins[0].id : null;

        // 插入新聊天室記錄
        await db.execute(
          `INSERT INTO chat_rooms 
           (id, user_id, admin_id, name, status, created_at, last_message_time) 
           VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            roomId,
            userId,
            adminId,
            `會員${user[0].name}的諮詢`,
            'active'
          ]
        );

        console.log(`創建新聊天室: ${roomId} (用戶: ${userId})`);
      }

      // 將 socket 與用戶 ID 關聯
      socket.userId = userId;
      await socket.join(roomId);

      // 返回聊天室資訊
      socket.emit('roomJoined', { 
        roomId,
        userId,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('加入房間錯誤:', error);
      socket.emit('error', { 
        message: '加入房間失敗',
        details: error.message 
      });
    }
  });

  // 處理新訊息
  socket.on('message', async (data) => {
    try {
      console.log('收到新訊息資料:', data);  // 檢查接收到的數據

      // 確保所有必要數據都存在
      if (!data.roomId || !data.userId || !data.message) {
        throw new Error('缺少必要的訊息資料');
      }

      const { roomId, userId, message } = data;

      // 1. 驗證聊天室存在
      const [rooms] = await db.execute(
        `SELECT id, admin_id, user_id 
         FROM chat_rooms 
         WHERE id = ? 
         AND status = 'active'`,
        [roomId]
      );

      if (rooms.length === 0) {
        throw new Error('聊天室不存在或已關閉');
      }

      const room = rooms[0];
      
      // 2. 確認發送者身份
      const senderType = 'member';  // 因為是從前端發送，固定為會員
      
      // 3. 插入訊息記錄
      const messageId = uuidv4();

      console.log('準備插入訊息，參數:', {
        messageId,
        roomId,
        userId,
        senderType,
        message
      });

      await db.execute(
        `INSERT INTO chat_messages 
         (id, room_id, user_id, sender_type, message, message_type, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          messageId,
          roomId,
          userId,
          senderType,
          message,
          'text',
          'sent'
        ]
      );

      // 4. 更新聊天室最後訊息
      await db.execute(
        `UPDATE chat_rooms 
         SET last_message = ?,
             last_message_time = NOW(),
             unread_count = unread_count + 1
         WHERE id = ?`,
        [message, roomId]
      );

      // 5. 廣播訊息給聊天室所有成員
      const messageData = {
        id: messageId,
        room_id: roomId,
        user_id: userId,
        sender_type: senderType,
        message,
        message_type: 'text',
        status: 'sent',
        created_at: new Date().toISOString()
      };

      io.to(roomId).emit('message', messageData);
      console.log('✅ 訊息發送成功:', messageData);

    } catch (error) {
      console.error('❌ 發送訊息錯誤:', error);
      console.error('錯誤詳情:', {
        data: data,
        error: error.message,
        stack: error.stack
      });
      socket.emit('error', {
        message: '發送訊息失敗',
        details: error.message
      });
    }
  });

  // 新增已讀狀態更新功能
  socket.on('markAsRead', async ({ roomId, userId }) => {
    try {
      await db.execute(
        `UPDATE chat_messages 
         SET status = 'read' 
         WHERE room_id = ? 
         AND user_id != ?`,
        [roomId, userId]
      );

      await db.execute(
        `UPDATE chat_rooms 
         SET unread_count = 0 
         WHERE id = ?`,
        [roomId]
      );

      socket.to(roomId).emit('messagesRead', { roomId });
    } catch (error) {
      console.error('更新已讀狀態錯誤:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('🔴 用戶斷開連接 - Socket ID:', socket.id);
  });
});

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log(`服務器運行在端口 ${PORT}`);
});

// 在服務器啟動時測試數據庫連接
db.execute('SELECT 1')
  .then(() => {
    console.log('✅ 數據庫連接成功');
  })
  .catch(err => {
    console.error('❌ 數據庫連接失敗:', err);
  }); 