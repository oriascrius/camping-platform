require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const initializeWebSocket = require('./websocket');
const db = require('./models/connection');

const app = express();

// 統一的 CORS 配置
const corsOptions = {
  // origin: 定義允許存取的來源網址
  // 在開發和生產環境中，前端應用可能運行在不同的網址
  origin: [
    'http://localhost:3000',        // 開發環境：允許本地 Next.js 開發伺服器的請求
    process.env.NEXT_PUBLIC_FRONTEND_URL,  // 生產環境：允許部署後的前端網址存取
    'https://camping-platform-production.up.railway.app'  // 新增 Railway 網址
  ],
  
  // methods: 定義允許的 HTTP 請求方法
  // GET: 獲取資料
  // POST: 創建資料
  // PUT: 更新資料
  // DELETE: 刪除資料
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
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? [
          'https://camping-platform-production.up.railway.app',
          process.env.NEXT_PUBLIC_FRONTEND_URL,
          /\.railway\.app$/  // 允許所有 railway.app 子域名
        ]
      : "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
  path: '/socket.io/',
  transports: ['websocket', 'polling']
});

// 初始化 WebSocket 連接
// 將 io 實例和資料庫連接傳遞給 WebSocket 處理函數
initializeWebSocket(io, db);

// 使用 Railway 提供的端口
const port = process.env.PORT || 3002;

// 添加一些部署相關的日誌
server.listen(port, () => {
  console.log(`WebSocket 伺服器運行在端口 ${port}`);
  console.log(`環境：${process.env.NODE_ENV}`);
  console.log(`前端 URL：${process.env.NEXT_PUBLIC_FRONTEND_URL}`);
});

// 測試資料庫連接
db.execute('SELECT 1')
  .then(() => console.log('✅ 資料庫連接成功'))
  .catch(err => console.error('❌ 資料庫連接失敗:', err)); 