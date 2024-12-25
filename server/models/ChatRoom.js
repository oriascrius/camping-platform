const pool = require('./connection');
const { v4: uuidv4 } = require('uuid');

const chatRoomModel = {
  // 創建聊天室
  async create(userId) {
    const roomId = uuidv4();
    const [result] = await pool.execute(
      'INSERT INTO chat_rooms (id, name, status) VALUES (?, ?, ?)',
      [roomId, `Chat ${roomId.slice(0, 8)}`, 'active']
    );
    return { roomId, status: 'active' };
  },

  // 獲取聊天室訊息
  async getMessages(roomId) {
    const [messages] = await pool.execute(
      'SELECT * FROM chat_messages WHERE room_id = ? ORDER BY created_at ASC',
      [roomId]
    );
    return messages;
  }
};

module.exports = chatRoomModel; 