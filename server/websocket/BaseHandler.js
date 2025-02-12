class BaseHandler {
  constructor(io, socket, connections) {
    this.io = io;
    this.socket = socket;
    this.connections = connections;
    this.userId = socket.userId;
    this.userType = socket.userType;
    this.moduleName = this.constructor.name; // 獲取模組名稱
    this.setupConnectionHandlers();
  }

  setupConnectionHandlers() {
    // 監聽連接替換事件
    this.socket.on('connection:replace', ({ oldSocketId, newSocketId }) => {
      this.handleConnectionReplacement(oldSocketId, newSocketId);
    });
  }

  async handleConnectionReplacement(oldSocketId, newSocketId) {
    try {
      // 清理當前處理器的資源
      await this.cleanup();
      
      this.logInfo('處理器清理完成', {
        oldSocketId,
        newSocketId,
        userId: this.userId
      });
    } catch (error) {
      this.handleError(error, '連接替換清理');
    }
  }

  // 清理資源的方法（子類可覆蓋）
  async cleanup() {
    try {
      // 執行具體的清理邏輯
      await this._cleanup();
      
      // 通知清理完成
      this.socket.emit('cleanup:complete');
      
      this.logInfo('處理器清理完成', {
        socketId: this.socket.id,
        userId: this.userId
      });
    } catch (error) {
      this.logError('處理器清理失敗', error);
    }
  }

  // 具體的清理邏輯（由子類實現）
  async _cleanup() {
    // 基礎清理邏輯
  }

  // 基礎錯誤處理
  handleError(error, context) {
    this.logError(context, error);
  }

  // 事件發送包裝
  emit(event, data) {
    try {
      this.socket.emit(event, data);
    } catch (error) {
      this.handleError(error, '事件發送');
    }
  }

  // 事件監聽包裝
  on(event, handler) {
    this.socket.on(event, async (...args) => {
      try {
        await handler.apply(this, args);
      } catch (error) {
        this.handleError(error, `處理 ${event} 事件`);
      }
    });
  }

  // 日誌工具方法
  logInfo(action, data = {}) {
    console.log(`[${this.moduleName}] ${action}:`, {
      socketId: this.socket.id,
      userId: this.userId,
      userType: this.userType,
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  logError(action, error, data = {}) {
    console.error(`[${this.moduleName}] ❌ ${action}:`, {
      socketId: this.socket.id,
      userId: this.userId,
      userType: this.userType,
      error: error.message,
      stack: error.stack,
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  logWarning(action, data = {}) {
    console.warn(`[${this.moduleName}] ⚠️ ${action}:`, {
      socketId: this.socket.id,
      userId: this.userId,
      userType: this.userType,
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  logDebug(action, data = {}) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[${this.moduleName}] 🔍 ${action}:`, {
        socketId: this.socket.id,
        userId: this.userId,
        userType: this.userType,
        ...data,
        timestamp: new Date().toISOString()
      });
    }
  }
}

module.exports = BaseHandler; 