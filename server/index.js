require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const initializeWebSocket = require('./websocket/socketManager');
const db = require('./models/connection');

const app = express();

// 統一的 CORS 配置
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        process.env.NEXT_PUBLIC_FRONTEND_URL,  // Vercel 前端網址
        /\.vercel\.app$/  // 允許所有 vercel.app 子域名
      ]
    : "http://localhost:3000",
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  
  // credentials: 允許跨域請求攜帶認證資訊（如 cookies, HTTP authentication）
  // 對於需要維持使用者登入狀態的應用來說是必須的
  credentials: true
};

// Express CORS 設定
// 用於處理一般的 HTTP 請求（如 API 呼叫）
app.use(cors(corsOptions));

const server = http.createServer(app);

// WebSocket CORS 設置
// 用於處理即時通訊功能（如聊天、通知）
// 使用相同的 CORS 配置確保一致性
const io = new Server(server, {
  path: '/socket.io/',
  cors: corsOptions,
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 30000,
  transports: ['websocket'],
  allowEIO3: false,           // 禁用 Engine.IO v3
  allowUpgrades: false,       // 禁止協議升級
  upgradeTimeout: 10000,      // 升級超時時間
  perMessageDeflate: false,   // 禁用消息壓縮
  maxHttpBufferSize: 1e8,
  cors: {
    ...corsOptions,
    methods: ["GET", "POST"],
    allowedHeaders: ["content-type"]
  }
});

// Socket.IO 中間件
io.use((socket, next) => {
  const { userId, userType } = socket.handshake.query;
  
  if (!userId) {
    return next(new Error('Authentication error'));
  }

  // 添加用戶信息到 socket
  socket.userId = userId;
  socket.userType = userType;
  
  console.log('Socket 中間件驗證:', {
    socketId: socket.id,
    userId,
    userType
  });
  
  next();
});

// 初始化 WebSocket 連接
initializeWebSocket(io, db);

// 使用環境變數的端口
const port = process.env.PORT || 3002;

// 添加部署相關的日誌
server.listen(port, () => {
  console.log(`WebSocket 伺服器運行在端口 ${port}`);
  console.log(`環境：${process.env.NODE_ENV}`);
  console.log(`前端 URL：${process.env.NEXT_PUBLIC_FRONTEND_URL}`);
  console.log(`Socket.IO 配置:`, {
    pingTimeout: io.engine.opts.pingTimeout,
    pingInterval: io.engine.opts.pingInterval,
    transports: io.engine.opts.transports
  });
});

// 測試資料庫連接
db.execute('SELECT 1')
  .then(() => console.log('✅ 資料庫連接成功'))
  .catch(err => console.error('❌ 資料庫連接失敗:', err));

// Socket.IO 錯誤處理
io.engine.on("connection_error", (err) => {
  console.error('Socket.IO 連接錯誤:', {
    code: err.code,
    message: err.message,
    context: err.context
  });
});

// 移除全局心跳檢測
io.on('connection', (socket) => {
  const { userId, userType, transport } = socket.handshake.query;
  console.log(`新連接 - ID: ${socket.id}, Transport: ${socket.conn.transport.name}`);
  
  // 如果不是 websocket 連接，立即斷開
  if (socket.conn.transport.name !== 'websocket') {
    console.log('非 WebSocket 連接，斷開');
    socket.disconnect(true);
    return;
  }
});

// 全局錯誤處理
process.on('unhandledRejection', (reason, promise) => {
  console.error('未處理的 Promise 拒絕:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('未捕獲的異常:', error);
}); 