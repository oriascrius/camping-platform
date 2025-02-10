const { v4: uuidv4 } = require('uuid');
const pool = require('../models/connection');

function initializeNotifyHandler(io, socket, connections) {
  // 獲取用戶資訊
  const { userId, userType } = socket.handshake.query;
  console.log('\n=== 初始化通知處理器 ===');
  console.log('用戶資訊:', { userId, userType });

  // 發送群組通知處理
  socket.on('sendGroupNotification', async (data) => {
    try {
      // 檢查是否為管理員
      if (userType !== 'admin') {
        throw new Error('只有管理員可以發送群組通知');
      }

      const { type, title, content, targetRole } = data;
      
      // 根據目標角色獲取用戶列表
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

      // 批量插入通知
      let successCount = 0;
      let failureCount = 0;
      const errors = [];

      for (const targetUserId of targetUsers) {
        try {
          const notificationId = uuidv4();
          // 插入通知到資料庫
          await pool.execute(
            `INSERT INTO notifications 
             (id, user_id, type, title, content, is_read, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [notificationId, targetUserId, type, title, content, 0]
          );
          
          // 檢查 connections 是否存在並且有相應的方法
          if (connections && 
              (connections.memberSockets instanceof Map || 
               connections.ownerSockets instanceof Map)) {
            
            // 如果用戶在線，即時發送通知
            const userSocket = connections.memberSockets.get(targetUserId) || 
                             connections.ownerSockets.get(targetUserId);
            
            if (userSocket) {
              userSocket.emit('newNotification', {
                id: notificationId,
                user_id: targetUserId,
                type,
                title,
                content,
                is_read: 0,
                created_at: new Date().toISOString()
              });
            }
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
        success: successCount > 0,  // 只要有成功發送就算成功
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
      // 查詢未刪除的通知
      const [notifications] = await pool.execute(
        `SELECT * FROM notifications 
         WHERE user_id = ? 
         AND is_deleted = 0 
         ORDER BY created_at DESC`,
        [userId]
      );

      // 查詢未讀且未刪除的數量
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
      // 更新資料庫
      await pool.execute(
        `UPDATE notifications 
         SET is_read = 1,
             updated_at = NOW()
         WHERE id = ?`,
        [notificationId]
      );

      // 發送更新事件
      socket.emit('notificationRead', { notificationId });

    } catch (error) {
      console.error('標記已讀失敗:', error);
      socket.emit('error', { message: '標記已讀失敗' });
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

  // 修改刪除通知處理
  socket.on('deleteNotifications', async ({ type }) => {
    try {
      console.log('\n=== 開始處理刪除通知請求 ===');
      console.log('用戶ID:', userId);
      console.log('刪除類型:', type);

      let query = `
        UPDATE notifications 
        SET is_deleted = 1,
            updated_at = NOW() 
        WHERE user_id = ? 
        AND is_deleted = 0
      `;
      const params = [userId];

      if (type && type !== 'all') {
        query += ' AND type = ?';
        params.push(type);
      }

      console.log('執行 SQL:', query);
      console.log('SQL 參數:', params);

      const [result] = await pool.execute(query, params);
      console.log('SQL 執行結果:', result);

      if (result.affectedRows > 0) {
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

      } else {
        console.log('沒有找到需要刪除的通知');
        // 即使沒有刪除任何通知，也發送成功事件
        socket.emit('notificationsDeleted');
        socket.emit('notificationsList', {
          notifications: [],
          unreadCount: 0
        });
      }

    } catch (error) {
      console.error('刪除通知失敗:', error);
      socket.emit('error', { 
        message: '刪除通知失敗',
        error: error.message 
      });
    }
  });
}

module.exports = initializeNotifyHandler;
