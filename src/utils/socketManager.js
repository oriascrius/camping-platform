import io from "socket.io-client";

class SocketManager {
  static instance = null;
  socket = null;
  listeners = new Map(); // 追蹤所有事件監聽器
  connectionStatus = {
    isConnected: false,
    lastError: null
  };

  static getInstance() {
    if (!this.instance) {
      this.instance = new SocketManager();
    }
    return this.instance;
  }

  // 初始化連接
  connect(config) {
    // 如果已經有活躍連接，直接返回
    if (this.socket?.connected) {
      console.log("使用現有連接:", this.socket.id);
      return this.socket;
    }

    // 建立新連接
    this.socket = io(process.env.NEXT_PUBLIC_API_URL, {
      query: config.query,
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5
    });

    // 設置基本事件監聽
    this.setupBaseListeners();
    
    return this.socket;
  }

  // 設置基本事件監聽器
  setupBaseListeners() {
    this.socket.on('connect', () => {
      console.log("Socket 連接成功:", this.socket.id);
      this.connectionStatus.isConnected = true;
      this.connectionStatus.lastError = null;
      this.notifyListeners('connectionChange', true);
    });

    this.socket.on('disconnect', (reason) => {
      console.log("Socket 斷開連接:", reason);
      this.connectionStatus.isConnected = false;
      this.notifyListeners('connectionChange', false);
    });

    // 設置心跳檢測
    this.setupHeartbeat();
  }

  // 設置心跳檢測
  setupHeartbeat() {
    const heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ping');
      }
    }, 25000);

    this.socket.on('pong', () => {
      console.log('收到服務器心跳回應');
    });

    // 保存清理函數
    this.cleanupHeartbeat = () => {
      clearInterval(heartbeatInterval);
      this.socket?.off('pong');
    };
  }

  // 添加事件監聽器
  addEventListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  // 移除事件監聽器
  removeEventListener(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  // 通知所有監聽器
  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }

  // 獲取當前連接狀態
  getConnectionStatus() {
    return this.connectionStatus;
  }

  // 獲取當前 socket
  getSocket() {
    return this.socket;
  }

  // 關閉連接
  disconnect() {
    if (this.socket) {
      this.cleanupHeartbeat?.();
      this.socket.disconnect();
      this.socket = null;
      this.connectionStatus.isConnected = false;
    }
  }
}

export default SocketManager; 