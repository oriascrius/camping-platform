const initializeChatHandler = require("./chatHandler");
const initializeNotifyHandler = require("./notifyHandler");

class SocketManager {
  constructor(io) {
    this.io = io;
    this.connections = {
      memberSockets: new Map(),
      ownerSockets: new Map(),
      adminSockets: new Map()
    };
    this.connectionTimes = new Map();
    this.handlers = new Map();
    
    // 新增：連接狀態追蹤
    this.connectionStats = new Map();
    this.pendingConnections = new Map(); // 新增：追蹤正在建立的連接
  }

  // 初始化所有處理器
  initializeHandlers() {
    this.handlers.set('chat', initializeChatHandler);
    this.handlers.set('notify', initializeNotifyHandler);
  }

  // 處理新連接
  async handleConnection(socket) {
    const { userId, userType } = socket.handshake.query;
    
    try {
      // 檢查是否有正在處理的連接
      if (this.pendingConnections.has(userId)) {
        this.logWarning('重複的連接請求', {
          userId,
          existingConnection: this.pendingConnections.get(userId),
          newSocketId: socket.id
        });
        socket.disconnect();
        return;
      }

      // 記錄正在處理的連接
      this.pendingConnections.set(userId, {
        socketId: socket.id,
        timestamp: Date.now()
      });

      // 連接頻率限制
      if (!this.checkConnectionThrottle(userId)) {
        socket.disconnect();
        return;
      }

      const socketMap = this.getSocketMap(userType);
      const existingSocket = socketMap.get(userId);

      if (existingSocket?.connected) {
        // 檢查是否是短時間內的重複連接
        const lastConnectTime = this.connectionTimes.get(userId)?.lastConnect || 0;
        if (Date.now() - lastConnectTime < 2000) { // 2秒內的重複連接
          this.logWarning('短時間內的重複連接', {
            userId,
            timeSinceLastConnect: Date.now() - lastConnectTime
          });
          socket.disconnect();
          return;
        }

        // 處理現有連接
        await this.handleExistingConnection(existingSocket, socket);
      }

      // 初始化新連接
      await this.initializeNewConnection(socket, userId, userType);

    } catch (error) {
      this.logError('連接處理失敗', {
        socketId: socket.id,
        userId,
        error: error.message
      });
      socket.disconnect();
    } finally {
      // 清理正在處理的連接記錄
      this.pendingConnections.delete(userId);
    }
  }

  // 初始化新連接
  async initializeNewConnection(socket, userId, userType) {
    const socketMap = this.getSocketMap(userType);
    
    // 設置新連接
    socketMap.set(userId, socket);
    
    // 設置基本事件監聽
    this.setupBaseListeners(socket, userId, userType);
    
    // 初始化所有處理器
    await this.initializeAllHandlers(socket, userId, userType);

    console.log("✅ 新連接初始化完成:", {
      socketId: socket.id,
      userId,
      userType,
      timestamp: new Date().toISOString()
    });
  }

  // 處理現有連接
  async handleExistingConnection(existingSocket, newSocket) {
    try {
      // 通知舊連接即將被替換
      existingSocket.emit('connection:replace', {
        oldSocketId: existingSocket.id,
        newSocketId: newSocket.id
      });

      // 等待舊連接清理完成
      await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.log('舊連接清理超時');
          resolve();
        }, 2000);

        existingSocket.once('cleanup:complete', () => {
          clearTimeout(timeout);
          resolve();
        });
      });

      // 強制斷開舊連接
      existingSocket.disconnect(true);
      console.log(`已斷開舊連接: ${existingSocket.id}`);
    } catch (error) {
      console.error('處理舊連接時出錯:', error);
    }
  }

  // 改進基本事件監聽設置
  setupBaseListeners(socket, userId, userType) {
    let heartbeatInterval;
    let missedHeartbeats = 0;
    const MAX_MISSED_HEARTBEATS = 3;

    // 更頻繁的心跳檢測
    heartbeatInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit('ping');
        missedHeartbeats++;
        
        if (missedHeartbeats >= MAX_MISSED_HEARTBEATS) {
          this.logWarning('心跳檢測失敗', {
            socketId: socket.id,
            userId,
            missedCount: missedHeartbeats
          });
          
          // 主動重新連接
          this.handleReconnection(socket, userId, userType);
        }
      } else {
        clearInterval(heartbeatInterval);
      }
    }, 5000); // 每 5 秒檢測一次

    // 接收心跳回應
    socket.on('pong', () => {
      missedHeartbeats = 0;
      this.updateConnectionStats(userId, 'heartbeat');
    });

    // 監聽網絡狀態
    socket.conn.on('packet', (packet) => {
      if (packet.type === 'ping') {
        this.updateConnectionStats(userId, 'ping');
      }
    });

    // 清理完成事件
    socket.on('cleanup:complete', () => {
      console.log(`連接清理完成: ${socket.id}`);
    });

    // 斷開連接處理
    socket.on('disconnect', (reason) => {
      clearInterval(heartbeatInterval);
      this.handleDisconnect(socket, userId, userType, reason);
    });

    // 錯誤處理
    socket.on('error', (error) => {
      console.error("Socket 錯誤:", {
        socketId: socket.id,
        userId,
        error: error.message
      });
    });
  }

  // 新增：更新連接統計
  updateConnectionStats(userId, type) {
    if (!this.connectionStats.has(userId)) {
      this.connectionStats.set(userId, {
        lastActivity: Date.now(),
        disconnectCount: 0,
        reconnectCount: 0,
        transportCloseCount: 0
      });
    }

    const stats = this.connectionStats.get(userId);
    stats.lastActivity = Date.now();
    
    if (type === 'disconnect') {
      stats.disconnectCount++;
    } else if (type === 'reconnect') {
      stats.reconnectCount++;
    } else if (type === 'transportClose') {
      stats.transportCloseCount++;
    }
  }

  // 新增：處理重新連接
  async handleReconnection(socket, userId, userType) {
    this.logInfo('嘗試重新連接', {
      socketId: socket.id,
      userId,
      userType
    });

    try {
      // 先斷開當前連接
      socket.disconnect();
      
      // 等待短暫時間
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 重新初始化連接
      const newSocket = await this.initializeNewConnection(socket, userId, userType);
      
      this.logInfo('重新連接成功', {
        oldSocketId: socket.id,
        newSocketId: newSocket.id,
        userId
      });
      
      this.updateConnectionStats(userId, 'reconnect');
    } catch (error) {
      this.logError('重新連接失敗', {
        socketId: socket.id,
        userId,
        error: error.message
      });
    }
  }

  // 檢查連接頻率
  checkConnectionThrottle(userId) {
    const now = Date.now();
    const lastConnectTime = this.connectionTimes.get(userId);
    
    if (lastConnectTime && (now - lastConnectTime) < 5000) { // 增加到 5 秒
      console.log(`連接頻率過高: ${userId}`);
      return false;
    }
    
    this.connectionTimes.set(userId, now);
    return true;
  }

  // 初始化所有處理器
  async initializeAllHandlers(socket, userId, userType) {
    this.handlers.forEach((handler, name) => {
      try {
        handler(this.io, socket, this.connections);
        console.log(`✅ ${name} 處理器初始化成功`);
      } catch (error) {
        console.error(`❌ ${name} 處理器初始化失敗:`, error);
      }
    });
  }

  // 處理斷開連接
  handleDisconnect(socket, userId, userType, reason) {
    this.logInfo('連接斷開', {
      socketId: socket.id,
      userId,
      userType,
      reason,
      transport: socket.conn?.transport?.name,
      connectionStats: this.connectionStats.get(userId),
      time: new Date().toISOString()
    });

    if (reason === 'transport close') {
      this.updateConnectionStats(userId, 'transportClose');
      
      // 如果短時間內斷開次數過多，記錄警告
      const stats = this.connectionStats.get(userId);
      if (stats?.transportCloseCount > 3) {
        this.logWarning('頻繁的傳輸層斷開', {
          userId,
          stats
        });
      }
    }

    // 清理連接記錄
    const socketMap = this.getSocketMap(userType);
    if (socketMap.get(userId)?.id === socket.id) {
      socketMap.delete(userId);
    }
  }

  // 日誌工具方法
  logInfo(action, data = {}) {
    console.log(`[SocketManager] ${action}:`, data);
  }

  logWarning(action, data = {}) {
    console.warn(`[SocketManager] ⚠️ ${action}:`, data);
  }

  logError(action, data = {}) {
    console.error(`[SocketManager] ❌ ${action}:`, data);
  }

  // 獲取對應的 socket map
  getSocketMap(userType) {
    switch (userType) {
      case 'admin': return this.connections.adminSockets;
      case 'owner': return this.connections.ownerSockets;
      default: return this.connections.memberSockets;
    }
  }

  // 更新連接時間記錄
  updateConnectionTime(userId) {
    this.connectionTimes.set(userId, {
      lastConnect: Date.now(),
      attempts: (this.connectionTimes.get(userId)?.attempts || 0) + 1
    });
  }

  // 清理過期的連接記錄
  startCleanupTask() {
    setInterval(() => {
      const now = Date.now();
      
      // 清理過期的待處理連接
      for (const [userId, data] of this.pendingConnections) {
        if (now - data.timestamp > 5000) { // 5秒後清理
          this.pendingConnections.delete(userId);
        }
      }

      // 清理過期的連接時間記錄
      for (const [userId, data] of this.connectionTimes) {
        if (now - data.lastConnect > 60000) { // 1分鐘後清理
          this.connectionTimes.delete(userId);
        }
      }
    }, 30000); // 每30秒執行一次
  }
}

// 導出初始化函數
function initializeWebSocket(io) {
  const socketManager = new SocketManager(io);
  socketManager.initializeHandlers();
  socketManager.startCleanupTask();

  io.on('connection', (socket) => {
    socketManager.handleConnection(socket);
  });
}

module.exports = initializeWebSocket;
