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

  // 追蹤已發送歡迎通知的用戶
  const welcomedUsers = new Set();

  // 監聽新的連接
  io.on("connection", async (socket) => {
    console.log("\n=== 新的 Socket 連接 ===");
    const { userId, userType } = socket.handshake.query;
    console.log("連接資訊:", { userId, userType, socketId: socket.id });

    try {
      // 檢查是否已有相同用戶的連接
      const socketMap = userType === "admin" 
        ? connections.adminSockets 
        : userType === "member" 
          ? connections.memberSockets 
          : connections.ownerSockets;

      // 如果已有連接，斷開舊連接
      const existingSocket = socketMap.get(userId);
      if (existingSocket) {
        console.log("用戶已有連接，斷開舊連接:", existingSocket.id);
        existingSocket.disconnect();
        socketMap.delete(userId);  // 確保移除舊連接
      }

      // 儲存新的 socket 連接
      socketMap.set(userId, socket);
      socket.join(`user-notifications-${userId}`);
      console.log("✅ Socket 連接已儲存");

      // 處理用戶登入通知 - 確保只發送一次
      if ((userType === "member" || userType === "owner") && !welcomedUsers.has(userId)) {
        console.log("\n=== 開始處理歡迎通知 ===");
        console.log("符合發送條件：", userType);
        console.log("用戶ID:", userId, "之前沒有收到過歡迎通知");
        
        try {
          // 更新用戶的最後登入時間
          const userTable = userType === "member" ? "users" : "owners";
          console.log("更新登入時間 - 表格:", userTable);
          
          await pool.execute(
            `UPDATE ${userTable} SET last_login = NOW() WHERE id = ?`,
            [userId]
          );
          console.log("✅ 已更新最後登入時間");

          // 創建歡迎通知
          const welcomeNotification = {
            id: uuidv4(),
            user_id: userId,
            type: 'system',
            title: '歡迎回來！',
            content: '感謝您再次造訪我們的網站',
            is_read: 0,
            is_deleted: 0
          };

          console.log('\n=== 準備創建歡迎通知 ===');
          console.log('通知內容:', welcomeNotification);

          // 插入歡迎通知到資料庫
          console.log('執行 SQL 插入...');
          await pool.execute(`
            INSERT INTO notifications 
            (id, user_id, type, title, content, is_read, is_deleted)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [
            welcomeNotification.id,
            welcomeNotification.user_id,
            welcomeNotification.type,
            welcomeNotification.title,
            welcomeNotification.content,
            welcomeNotification.is_read,
            welcomeNotification.is_deleted
          ]);
          console.log('✅ SQL 插入成功');

          // 發送新通知事件
          console.log('發送 Socket 事件: newNotification');
          socket.emit('newNotification', {
            ...welcomeNotification,
            created_at: new Date().toISOString()
          });
          console.log('✅ Socket 事件已發送');

          // 標記該用戶已收到歡迎通知
          welcomedUsers.add(userId);
          console.log('✅ 用戶已加入歡迎名單');

        } catch (error) {
          console.error('\n❌ 歡迎通知處理失敗:');
          console.error('錯誤詳情:', error);
        }
      } else {
        console.log(`用戶 ${userId} 不需要發送歡迎通知:`, {
          isWelcomed: welcomedUsers.has(userId),
          userType
        });
      }

      // 初始化處理器
      console.log("\n=== 初始化處理器 ===");
      initializeChatHandler(io, socket, connections);
      initializeNotifyHandler(io, socket, connections);
      console.log("✅ 處理器初始化完成");

    } catch (error) {
      console.error("\n❌ Socket 連接處理失敗:");
      console.error('錯誤詳情:', error);
    }

    // 監聽斷開連接
    socket.on("disconnect", () => {
      console.log("Socket 斷開連接:", socket.id);
      if (userType === "admin") {
        connections.adminSockets.delete(userId);
        socket.leave('admin-notifications');
      } else {
        const socketMap = userType === "member" ? connections.memberSockets : connections.ownerSockets;
        socketMap.delete(userId);
        socket.leave(`user-notifications-${userId}`);
      }
    });

    // 錯誤處理
    socket.on("error", (error) => {
      console.error("Socket 錯誤:", error);
    });
  });

  // 定期清理斷開的連接 (每分鐘檢查一次)
  setInterval(() => {
    for (const [type, sockets] of Object.entries(connections)) {
      for (const [userId, socket] of sockets.entries()) {
        if (!socket.connected) {
          console.log(`清理斷開的 ${type} 連接:`, userId);
          sockets.delete(userId);
        }
      }
    }
  }, 60000);
}

module.exports = initializeWebSocket;
