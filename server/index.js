require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const initializeWebSocket = require('./websocket');
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

// 初始化 WebSocket
initializeWebSocket(io, db);

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log(`服務器運行在端口 ${PORT}`);
});

// 測試數據庫連接
db.execute('SELECT 1')
  .then(() => console.log('✅ 數據庫連接成功'))
  .catch(err => console.error('❌ 數據庫連接失敗:', err)); 