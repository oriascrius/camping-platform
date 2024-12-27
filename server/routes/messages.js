router.put('/messages/read/:roomId', async (req, res) => {
  const { roomId } = req.params;
  
  try {
    // 更新該聊天室的所有未讀訊息為已讀
    await db.execute(
      `UPDATE chat_messages 
       SET status = 'read', 
           read_at = NOW() 
       WHERE room_id = ? 
       AND status = 'sent'`,
      [roomId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('更新已讀狀態失敗:', error);
    res.status(500).json({ error: '更新已讀狀態失敗' });
  }
}); 