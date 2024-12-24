const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// 最簡單的連接處理
io.on('connection', (socket) => {
  console.log('✅ 新用戶連接 - Socket ID:', socket.id);

  socket.on('message', (data) => {
    console.log('📨 收到消息:', data);
    // 廣播消息給所有客戶端
    io.emit('message', data);
    // 立即發送已送達狀態給發送者
    socket.emit('messageStatus', {
      messageId: data.id,
      status: 'delivered',
      userId: data.userId
    });
  });

  socket.on('messageDelivered', ({ messageId, userId }) => {
    // 廣播消息已送達狀態
    io.emit('messageStatus', {
      messageId,
      status: 'delivered',
      userId
    });
  });

  socket.on('messageRead', ({ messageId, userId }) => {
    // 廣播消息已讀狀態
    io.emit('messageStatus', {
      messageId,
      status: 'read',
      userId
    });
  });

  // 處理正在輸入事件
  socket.on('typing', (data) => {
    socket.broadcast.emit('userTyping', data);
  });

  socket.on('stopTyping', (data) => {
    socket.broadcast.emit('userStoppedTyping', data);
  });

  socket.on('disconnect', () => {
    console.log('🔴 用戶斷開連接 - Socket ID:', socket.id);
  });
});

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log(`服務器運行在端口 ${PORT}`);
}); 