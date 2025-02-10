const initializeChatHandler = require('./chatHandler');
const initializeNotifyHandler = require('./notifyHandler');
const { v4: uuidv4 } = require('uuid');
const pool = require('../models/connection');

function initializeWebSocket(io, db) {
  // 儲存所有連接的 socket
  const connections = {
    memberSockets: new Map(),  // 會員的 socket 連接
    ownerSockets: new Map(),   // 營主的 socket 連接
    adminSockets: new Map()    // 管理員的 socket 連接
  };

  
  // 監聽新的連接
  io.on('connection', async (socket) => {
    console.log('\n=== 新的 Socket 連接 ===');
    
    const { userId, userType } = socket.handshake.query;
    console.log('連接資訊:', { userId, userType, socketId: socket.id });

    // 根據使用者類型儲存 socket 連接
    if (userType === 'admin') {
      connections.adminSockets.set(userId, socket);
      
      // 管理員連接時直接處理用戶列表請求
      try {
        console.log('\n=== 自動請求會員列表 ===');
        
        // 獲取會員列表 - 只查詢基本資訊
        const [users] = await pool.execute(`
          SELECT id, name, email
          FROM users 
          ORDER BY id DESC
        `);
        
        console.log('會員查詢結果:', {
          總數: users.length,
          用戶列表: users.map(u => ({ id: u.id, name: u.name }))
        });
        
        socket.emit('usersList', users);
        
        // 獲取營主列表 - 只查詢基本資訊
        const [owners] = await pool.execute(`
          SELECT id, name, email
          FROM owners 
          ORDER BY id DESC
        `);
        
        console.log('營主查詢結果:', {
          總數: owners.length,
          營主列表: owners.map(o => ({ id: o.id, name: o.name }))
        });
        
        socket.emit('ownersList', owners);
        
      } catch (error) {
        console.error('❌ 獲取用戶列表失敗:', error);
        socket.emit('error', { message: error.message });
      }
    } else if (userType === 'member') {
      connections.memberSockets.set(userId, socket);
    } else if (userType === 'owner') {
      connections.ownerSockets.set(userId, socket);
    }

    // 處理用戶登入通知
    if ((userType === "member" || userType === "owner")) {
      try {
        // 先檢查用戶的最後登入時間
        const userTable = userType === "member" ? "users" : "owners";
        const [lastLogin] = await pool.execute(
          `SELECT last_login FROM ${userTable} WHERE id = ?`,
          [userId]
        );

        // 只有當最後登入時間為空，或者與當前時間相差超過 30 分鐘時，才發送歡迎通知
        const shouldSendWelcome = lastLogin[0]?.last_login
          ? (new Date() - new Date(lastLogin[0].last_login)) > 1800000  // 30分鐘 = 30 * 60 * 1000 毫秒
          : true;

        if (shouldSendWelcome) {
          // 生成歡迎通知
          const welcomeNotification = {
            id: uuidv4(),
            user_id: userId,
            type: 'system',
            title: '歡迎回來',
            content: lastLogin[0]?.last_login 
              ? `您已成功登入系統，上次登入時間：${new Date(lastLogin[0].last_login).toLocaleString('zh-TW')}`
              : '歡迎首次登入系統！',
            is_read: false,
            created_at: new Date()
          };

          // 儲存通知到資料庫
          await pool.execute(
            `INSERT INTO notifications 
             (id, user_id, type, title, content, is_read, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [
              welcomeNotification.id,
              userId,
              welcomeNotification.type,
              welcomeNotification.title,
              welcomeNotification.content,
              0
            ]
          );

          // 即時發送通知給用戶
          socket.emit("newNotification", welcomeNotification);

          // 更新用戶的最後登入時間
          await pool.execute(
            `UPDATE ${userTable} SET last_login = NOW() WHERE id = ?`,
            [userId]
          );
        }
      } catch (error) {
        console.error("發送登入通知失敗:", error);
      }
    }

    // 初始化聊天處理
    initializeChatHandler(io, socket, connections);
    
    // 初始化通知處理
    initializeNotifyHandler(io, socket, connections);

    // 監聽斷開連接
    socket.on('disconnect', () => {
      console.log('Socket 斷開連接:', socket.id);
      
      // 從連接列表中移除
      if (userType === 'member') {
        connections.memberSockets.delete(userId);
      } else if (userType === 'owner') {
        connections.ownerSockets.delete(userId);
      } else if (userType === 'admin') {
        connections.adminSockets.delete(userId);
      }
    });

    // 錯誤處理
    socket.on('error', (error) => {
      console.error('Socket 錯誤:', error);
    });
  });

  // 定期清理斷開的連接
  setInterval(() => {
    for (const [userId, socket] of connections.memberSockets) {
      if (!socket.connected) connections.memberSockets.delete(userId);
    }
    for (const [userId, socket] of connections.ownerSockets) {
      if (!socket.connected) connections.ownerSockets.delete(userId);
    }
    for (const [userId, socket] of connections.adminSockets) {
      if (!socket.connected) connections.adminSockets.delete(userId);
    }
  }, 30000); // 每 30 秒清理一次
}

module.exports = initializeWebSocket;
