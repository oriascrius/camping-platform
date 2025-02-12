import io from "socket.io-client";

class SocketManager {
  static instance = null;
  socket = null;

  static getInstance() {
    if (!this.instance) {
      this.instance = new SocketManager();
    }
    return this.instance;
  }

  connect(config) {
    // 如果已經有活躍連接，直接返回
    if (this.socket?.connected) {
      console.log("使用現有連接:", this.socket.id);
      return this.socket;
    }

    const { userId, userType, roomId } = config.query;

    // 確保所有必要的房間 ID
    const query = {
      userId,
      userType,
      senderType: userType,
      roomId: roomId || `chat_${userId}`,  // 保留原有的 roomId
      chatRoomId: `chat_${userId}`,
      notificationRoomId: `notification_${userId}`
    };

    console.log("建立新連接，配置:", query);

    // 創建新連接
    this.socket = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
      query,
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    // 監聽連接狀態
    this.socket.on('connect', () => {
      console.log("Socket 連接成功:", this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log("Socket 斷開連接:", reason);
    });

    return this.socket;
  }

  // 取得當前連接
  getSocket() {
    return this.socket;
  }

  // 關閉連接
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export default SocketManager; 