const express = require('express');
const router = express.Router();
const pool = require('../models/connection');

// 獲取用戶的通知列表
router.get('/notifications', async (req, res) => {
  const userId = req.user.id; // 假設使用者資訊存在 req.user 中
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const [notifications] = await pool.execute(
      `SELECT * FROM notifications 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: '獲取通知失敗' });
  }
});

// 標記通知為已讀
router.put('/notifications/:id/read', async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    await pool.execute(
      `UPDATE notifications 
       SET is_read = TRUE 
       WHERE id = ? AND user_id = ?`,
      [id, userId]
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: '更新通知狀態失敗' });
  }
});

// 標記所有通知為已讀
router.put('/notifications/read-all', async (req, res) => {
  const userId = req.user.id;

  try {
    await pool.execute(
      `UPDATE notifications 
       SET is_read = TRUE 
       WHERE user_id = ?`,
      [userId]
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: '更新通知狀態失敗' });
  }
});

module.exports = router; 