require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const initializeWebSocket = require('./websocket/socketManager');
const db = require('./models/connection');

class ServerInitializer {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = null;
  }

  // 初始化 Express
  setupExpress() {
    const corsOptions = {
      origin: process.env.NODE_ENV === 'production' 
        ? [process.env.NEXT_PUBLIC_FRONTEND_URL, /\.vercel\.app$/]
        : "http://localhost:3000",
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true
    };
    this.app.use(cors(corsOptions));
  }

  // 初始化 Socket.IO
  setupSocketIO() {
    this.io = new Server(this.server, {
      path: '/socket.io/',
      cors: this.getCorsOptions(),
      ...this.getSocketOptions()
    });

    // Socket.IO 中間件
    this.io.use(this.socketAuthMiddleware);

    // 初始化 WebSocket 管理器
    initializeWebSocket(this.io, db);
  }

  // 獲取 CORS 配置
  getCorsOptions() {
    return {
      origin: process.env.NODE_ENV === 'production' 
        ? [process.env.NEXT_PUBLIC_FRONTEND_URL, /\.vercel\.app$/]
        : "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
      allowedHeaders: ["content-type"]
    };
  }

  // 獲取 Socket.IO 配置
  getSocketOptions() {
    return {
      pingTimeout: 60000,
      pingInterval: 25000,
      connectTimeout: 30000,
      transports: ['websocket'],
      allowEIO3: false,
      allowUpgrades: false,
      upgradeTimeout: 10000,
      perMessageDeflate: false,
      maxHttpBufferSize: 1e8
    };
  }

  // Socket 認證中間件
  socketAuthMiddleware(socket, next) {
    const { userId, userType } = socket.handshake.query;
    
    if (!userId) {
      return next(new Error('Authentication error'));
    }

    socket.userId = userId;
    socket.userType = userType;
    
    console.log('Socket 中間件驗證:', {
      socketId: socket.id,
      userId,
      userType
    });
    
    next();
  }

  // 設置錯誤處理
  setupErrorHandlers() {
    // Socket.IO 錯誤處理
    this.io.engine.on("connection_error", (err) => {
      console.error('Socket.IO 連接錯誤:', {
        code: err.code,
        message: err.message,
        context: err.context
      });
    });

    // 全局錯誤處理
    process.on('unhandledRejection', (reason, promise) => {
      console.error('未處理的 Promise 拒絕:', reason);
    });

    process.on('uncaughtException', (error) => {
      console.error('未捕獲的異常:', error);
    });
  }

  // 啟動服務器
  async start() {
    try {
      this.setupExpress();
      this.setupSocketIO();
      this.setupErrorHandlers();

      const port = process.env.PORT || 3002;
      
      await this.testDatabaseConnection();
      
      this.server.listen(port, () => {
        this.logServerInfo(port);
      });
    } catch (error) {
      console.error('服務器啟動失敗:', error);
      process.exit(1);
    }
  }

  // 測試資料庫連接
  async testDatabaseConnection() {
    try {
      await db.execute('SELECT 1');
      console.log('✅ 資料庫連接成功');
    } catch (err) {
      console.error('❌ 資料庫連接失敗:', err);
      throw err;
    }
  }

  // 記錄服務器信息
  logServerInfo(port) {
    console.log(`WebSocket 伺服器運行在端口 ${port}`);
    console.log(`環境：${process.env.NODE_ENV}`);
    console.log(`前端 URL：${process.env.NEXT_PUBLIC_FRONTEND_URL}`);
    console.log(`Socket.IO 配置:`, {
      pingTimeout: this.io.engine.opts.pingTimeout,
      pingInterval: this.io.engine.opts.pingInterval,
      transports: this.io.engine.opts.transports
    });
  }
}

// 啟動服務器
const server = new ServerInitializer();
server.start(); 