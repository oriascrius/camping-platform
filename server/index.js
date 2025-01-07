require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const initializeWebSocket = require('./websocket');
const db = require('./models/connection');

const app = express();

// 設定 CORS (跨來源資源共用)
app.use(cors({
  origin: 'http://localhost:3000',  // 允許前端網址存取（Next.js 應用程式的位址）
  methods: ['GET', 'POST', 'PUT', 'DELETE'],  // 允許的 HTTP 請求方法
  credentials: true  // 允許攜帶認證資訊（例如：cookies、authorization headers 等）
}));

const server = http.createServer(app);

// 設定 WebSocket 伺服器
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",  // 開發環境的前端位址
      process.env.NEXT_PUBLIC_FRONTEND_URL  // 生產環境的前端位址
    ],
    methods: ["GET", "POST"],  // WebSocket 允許的方法
    credentials: true  // 允許 WebSocket 攜帶認證資訊
  }
});

// 初始化 WebSocket 連接
initializeWebSocket(io, db);

// 設定伺服器監聽的端口
const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log(`伺服器運行在端口 ${PORT}`);
});

// 測試資料庫連接
db.execute('SELECT 1')
  .then(() => console.log('✅ 資料庫連接成功'))
  .catch(err => console.error('❌ 資料庫連接失敗:', err)); 