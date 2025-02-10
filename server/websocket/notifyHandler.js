const { v4: uuidv4 } = require('uuid');
const pool = require('../models/connection');

function initializeNotifyHandler(io, socket, connections) {
  // 獲取用戶資訊
  const { userId, userType } = socket.handshake.query;
  console.log('\n=== 初始化通知處理器 ===');
  console.log('用戶資訊:', { userId, userType });

  // 發送群組通知處理
  socket.on('sendGroupNotification', async (data) => {
    console.log('\n=== 收到群組通知請求 ===');
    console.log('發送者資訊:', { userId, userType });
    console.log('請求數據:', JSON.stringify(data, null, 2));
    
    try {
      // 檢查是否為管理員
      if (userType !== 'admin') {
        throw new Error('只有管理員可以發送群組通知');
      }

      const { type, title, content, targetRole } = data;
      
      // 根據目標角色獲取用戶列表 - 移除 status 和 is_deleted 條件
      let targetUsers = [];
      if (targetRole === 'all' || targetRole === 'user') {
        const [users] = await pool.execute(`
          SELECT id FROM users
        `);
        targetUsers.push(...users.map(u => u.id));
      }
      
      if (targetRole === 'all' || targetRole === 'owner') {
        const [owners] = await pool.execute(`
          SELECT id FROM owners
        `);
        targetUsers.push(...owners.map(o => o.id));
      }

      console.log('查詢到的目標用戶:', targetUsers);
      
      if (!targetUsers.length) {
        throw new Error('沒有找到符合條件的目標用戶');
      }

      // 驗證必要欄位
      if (!type || !title || !content) {
        throw new Error('缺少必要欄位');
      }

      // 批量插入通知
      let successCount = 0;
      let failureCount = 0;
      const errors = [];

      for (const targetUserId of targetUsers) {
        try {
          const notificationId = uuidv4();
          await pool.execute(
            `INSERT INTO notifications 
             (id, user_id, type, title, content, is_read, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [notificationId, targetUserId, type, title, content, 0]
          );
          
          // 如果用戶在線，即時發送通知
          const userSocket = connections.memberSockets.get(targetUserId) || 
                           connections.ownerSockets.get(targetUserId);
          
          if (userSocket) {
            userSocket.emit('newNotification', {
              id: notificationId,
              type,
              title,
              content,
              created_at: new Date()
            });
          }
          
          successCount++;
        } catch (error) {
          console.error(`發送給用戶 ${targetUserId} 失敗:`, error);
          failureCount++;
          errors.push({
            userId: targetUserId,
            error: error.message
          });
        }
      }

      // 回傳結果
      socket.emit('notificationSent', {
        success: failureCount === 0,
        message: `成功: ${successCount}, 失敗: ${failureCount}`,
        details: { successCount, failureCount, errors }
      });

    } catch (error) {
      console.error('發送通知失敗:', error);
      socket.emit('error', { 
        message: error.message || '發送通知失敗'
      });
    }
  });

  // 獲取通知列表
  socket.on('getNotifications', async () => {
    try {
      const [notifications] = await pool.execute(
        `SELECT * FROM notifications 
         WHERE user_id = ? 
         AND is_deleted = 0 
         ORDER BY created_at DESC`,
        [userId]
      );

      const [unreadResult] = await pool.execute(
        `SELECT COUNT(*) as count 
         FROM notifications 
         WHERE user_id = ? 
         AND is_read = 0 
         AND is_deleted = 0`,
        [userId]
      );

      socket.emit('notificationsList', {
        notifications,
        unreadCount: unreadResult[0].count
      });
    } catch (error) {
      console.error('獲取通知列表失敗:', error);
      socket.emit('error', { message: '獲取通知列表失敗' });
    }
  });

  // 標記通知已讀
  socket.on('markAsRead', async ({ notificationId }) => {
    try {
      await pool.execute(
        `UPDATE notifications 
         SET is_read = 1, 
             updated_at = NOW() 
         WHERE id = ? 
         AND user_id = ?`,
        [notificationId, userId]
      );

      socket.emit('notificationRead', { notificationId });
    } catch (error) {
      console.error('標記已讀失敗:', error);
      socket.emit('error', { message: '標記已讀失敗' });
    }
  });

  // 清空通知
  socket.on('clearNotifications', async ({ type }) => {
    try {
      let query = `
        UPDATE notifications 
        SET updated_at = NOW()
        WHERE user_id = ?
      `;
      const params = [userId];

      if (type && type !== 'all') {
        query += ' AND type = ?';
        params.push(type);
      }

      await pool.execute(query, params);
      socket.emit('notificationsCleared', { success: true });
    } catch (error) {
      console.error('清空通知失敗:', error);
      socket.emit('error', { message: '清空通知失敗' });
    }
  });
}

module.exports = initializeNotifyHandler;
