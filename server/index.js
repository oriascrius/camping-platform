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
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

io.on('connection', async (socket) => {
  console.log('✅ 新用戶連接 - Socket ID:', socket.id);

  socket.on('createRoom', async ({ userId }) => {
    try {
      console.log('📝 收到創建聊天室請求:', {
        socketId: socket.id,
        userId
      });
      
      const roomId = uuidv4();
      
      // 插入新聊天室記錄
      await db.execute(
        'INSERT INTO chat_rooms (id, name, status) VALUES (?, ?, ?)',
        [roomId, `Chat ${roomId.slice(0, 8)}`, 'active']
      );
      
      console.log('✅ 聊天室已創建:', {
        roomId,
        userId
      });
      
      socket.join(roomId);
      socket.emit('roomCreated', { roomId });
      
    } catch (error) {
      console.error('❌ 創建聊天室錯誤:', error);
      socket.emit('error', { 
        message: '創建聊天室失敗',
        details: error.message 
      });
    }
  });

  socket.on('message', async (data) => {
    console.log('📨 收到消息請求:', data);
    
    try {
      const { roomId, userId, message, messageType = 'text' } = data;
      
      if (!roomId || !userId || !message) {
        throw new Error('缺少必要參數');
      }

      const messageId = uuidv4();
      
      await db.execute(
        'INSERT INTO chat_messages (id, room_id, user_id, message, message_type) VALUES (?, ?, ?, ?, ?)',
        [messageId, roomId, userId, message, messageType]
      );
      
      const messageData = {
        id: messageId,
        room_id: roomId,
        user_id: userId,
        message,
        message_type: messageType,
        status: 'sent',
        created_at: new Date().toISOString()
      };
      
      console.log('✅ 消息已儲存並準備廣播:', messageData);
      
      io.to(roomId).emit('message', messageData);
      
    } catch (error) {
      console.error('❌ 發送消息錯誤:', error);
      socket.emit('error', { 
        message: '發送消息失敗',
        details: error.message 
      });
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