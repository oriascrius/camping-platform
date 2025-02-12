const initializeChatHandler = require("./chatHandler");
const initializeNotifyHandler = require("./notifyHandler");
const { v4: uuidv4 } = require("uuid");
const pool = require("../models/connection");

function initializeWebSocket(io, db) {
  // 儲存所有連接的 socket
  const connections = {
    memberSockets: new Map(),
    ownerSockets: new Map(),
    adminSockets: new Map(),
  };

  // 新增：連接時間追蹤
  const connectionTimes = new Map();

  // 監聽新的連接
  io.on("connection", async (socket) => {
    console.log("\n=== 新的 Socket 連接 ===");
    const { userId, userType } = socket.handshake.query;
    console.log("連接資訊:", { userId, userType, socketId: socket.id });
    
    try {
      // 新增：檢查連接時間間隔
      const now = Date.now();
      const lastConnectTime = connectionTimes.get(userId);
      if (lastConnectTime && (now - lastConnectTime) < 2000) { // 2秒內不允許重複連接
        console.log("連接過於頻繁，請稍後再試");
        socket.disconnect();
        return;
      }
      connectionTimes.set(userId, now);

      const socketMap = userType === "admin" 
        ? connections.adminSockets 
        : userType === "member" 
          ? connections.memberSockets 
          : connections.ownerSockets;

      // 檢查現有連接
      const existingSocket = socketMap.get(userId);
      if (existingSocket?.connected) {
        console.log("用戶已有活躍連接，保持現有連接:", existingSocket.id);
        socket.disconnect();
        return;
      }

      // 儲存新的連接
      socketMap.set(userId, socket);
      console.log("✅ Socket 連接已儲存 - ID:", socket.id);

      // 初始化處理器
      console.log("\n=== 初始化處理器 ===");
      initializeChatHandler(io, socket, connections);
      initializeNotifyHandler(io, socket, connections);
      console.log("✅ 處理器初始化完成");

      // 輸出完整連接信息
      console.log("新的 Socket 連接:", {
        id: socket.id,
        userId,
        userType,
        query: socket.handshake.query,
        transport: socket.conn.transport.name
      });

      // 監聽斷開連接
      socket.on("disconnect", (reason) => {
        console.log("Socket 斷開連接:", {
          id: socket.id,
          userId,
          reason
        });
        
        // 只在該 socket 仍然是當前用戶的 socket 時才移除
        if (socketMap.get(userId) === socket) {
          socketMap.delete(userId);
          console.log(`用戶 ${userId} 的連接已移除`);
        }
      });

      // 新增：定期清理過期的連接時間記錄
      const cleanupInterval = setInterval(() => {
        const currentTime = Date.now();
        for (const [userId, time] of connectionTimes) {
          if (currentTime - time > 60000) { // 1分鐘後清理
            connectionTimes.delete(userId);
          }
        }
      }, 60000);

      // 斷開連接時清理 interval
      socket.on("disconnect", () => {
        clearInterval(cleanupInterval);
      });

    } catch (error) {
      console.error("❌ Socket 連接處理失敗:", error);
      socket.disconnect();
    }

    // 錯誤處理
    socket.on("error", (error) => {
      console.error("Socket 錯誤:", error);
    });
  });
}

module.exports = initializeWebSocket;
