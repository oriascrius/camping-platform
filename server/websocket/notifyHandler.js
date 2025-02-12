const { v4: uuidv4 } = require('uuid');
const pool = require('../models/connection');

function initializeNotifyHandler(io, socket, connections) {
  // 獲取用戶資訊
  const { userId, userType } = socket.handshake.query;
  console.log('\n=== 初始化通知處理器 ===');
  console.log('用戶資訊:', { userId, userType });

  // 新增：訂閱通知頻道
  if (userType === 'admin') {
    socket.join('admin-notifications');
  } else {
    socket.join(`user-notifications-${userId}`);
  }

  // 添加心跳處理
  socket.on('ping', () => {
    console.log(`收到來自 ${socket.id} 的心跳`);
    socket.emit('pong');
  });

  // 修改群組通知發送邏輯
  socket.on('sendGroupNotification', async (data) => {
    try {
      if (userType !== 'admin') {
        throw new Error('只有管理員可以發送群組通知');
      }

      const { type, title, content, targetRole } = data;
      
      // 根據目標角色獲取用戶列表
      let targetUsers = [];
      if (targetRole === 'all' || targetRole === 'user') {
        const [users] = await pool.execute('SELECT id FROM users');
        targetUsers.push(...users.map(u => u.id));
      }
      
      if (targetRole === 'all' || targetRole === 'owner') {
        const [owners] = await pool.execute('SELECT id FROM owners');
        targetUsers.push(...owners.map(o => o.id));
      }

      console.log('目標用戶:', targetUsers.length);
      
      if (!targetUsers.length) {
        throw new Error('沒有找到符合條件的目標用戶');
      }

      // 批量插入通知
      const notifications = targetUsers.map(targetId => [
        uuidv4(),
        targetId,
        type,
        title,
        content,
        'system',
        new Date(),
        0,
        0
      ]);

      await pool.execute(
        `INSERT INTO notifications 
        (id, user_id, type, title, content, sender, created_at, is_read, is_deleted) 
        VALUES ?`,
        [notifications]
      );

      // 向每個目標用戶發送通知
      targetUsers.forEach(targetId => {
        io.to(`user-notifications-${targetId}`).emit('newNotification', {
          type,
          title,
          content
        });
      });

      socket.emit('groupNotificationSent', {
        success: true,
        message: `成功發送給 ${targetUsers.length} 個用戶`
      });

    } catch (error) {
      console.error('發送群組通知失敗:', error);
      socket.emit('error', { 
        message: '發送群組通知失敗',
        error: error.message 
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

      console.log('發送通知列表');
      socket.emit('notificationsList', {
        notifications,
        unreadCount: notifications.filter(n => !n.is_read).length
      });

    } catch (error) {
      console.error('獲取通知失敗:', error);
      socket.emit('error', { message: '獲取通知失敗' });
    }
  });

  // 標記通知為已讀
  socket.on('markAsRead', async (notificationId) => {
    try {
      await pool.execute(
        'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
        [notificationId, userId]
      );

      // 重新獲取未讀數量
      const [notifications] = await pool.execute(
        `SELECT * FROM notifications 
         WHERE user_id = ? 
         AND is_deleted = 0 
         AND is_read = 0`,
        [userId]
      );

      socket.emit('notificationUpdated', {
        notificationId,
        unreadCount: notifications.length
      });

    } catch (error) {
      console.error('標記通知已讀失敗:', error);
      socket.emit('error', { message: '標記通知已讀失敗' });
    }
  });

  // 標記全部已讀
  socket.on('markAllAsRead', async ({ type }) => {
    try {
      console.log('標記全部已讀 - 用戶ID:', userId);
      console.log('標記全部已讀 - 類型:', type);

      let query = `
        UPDATE notifications 
        SET is_read = 1, 
            updated_at = NOW() 
        WHERE user_id = ? 
        AND is_read = 0 
        AND is_deleted = 0
      `;
      const params = [userId];

      if (type && type !== 'all') {
        query += ' AND type = ?';
        params.push(type);
      }

      console.log('SQL 查詢:', query);
      console.log('參數:', params);

      const [result] = await pool.execute(query, params);
      console.log('SQL 執行結果:', result);

      // 重新獲取通知列表
      const [notifications] = await pool.execute(
        `SELECT * FROM notifications 
         WHERE user_id = ? 
         AND is_deleted = 0 
         ORDER BY created_at DESC`,
        [userId]
      );

      // 發送更新後的通知列表和未讀數量
      socket.emit('notificationsList', {
        notifications,
        unreadCount: notifications.filter(n => !n.is_read).length
      });

    } catch (error) {
      console.error('標記全部已讀失敗:', error);
      socket.emit('error', { message: '標記全部已讀失敗' });
    }
  });

  // 刪除通知
  socket.on('deleteNotifications', async () => {
    try {
      const [result] = await pool.execute(
        'UPDATE notifications SET is_deleted = 1 WHERE user_id = ?',
        [userId]
      );
      
      console.log(`成功刪除 ${result.affectedRows} 條通知`);
      
      // 先發送刪除成功事件
      socket.emit('notificationsDeleted');

      // 重新獲取通知列表
      const [notifications] = await pool.execute(
        `SELECT * FROM notifications 
         WHERE user_id = ? 
         AND is_deleted = 0 
         ORDER BY created_at DESC`,
        [userId]
      );

      console.log('發送更新後的通知列表');
      // 發送更新後的通知列表
      socket.emit('notificationsList', {
        notifications,
        unreadCount: notifications.filter(n => !n.is_read).length
      });

    } catch (error) {
      console.error('刪除通知失敗:', error);
      socket.emit('error', { 
        message: '刪除通知失敗',
        error: error.message 
      });
    }
  });

  // 添加連接斷開處理
  socket.on('disconnect', (reason) => {
    console.log(`用戶 ${userId} 斷開連接, 原因:`, reason);
    // 從連接池中移除
    if (connections.has(userId)) {
      connections.delete(userId);
    }
  });
}

module.exports = initializeNotifyHandler;
