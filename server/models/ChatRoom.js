const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema({
  roomId: String,
  type: String, // 'private' 或 'customer_service'
  participants: [{
    userId: String,
    role: String, // 'customer' 或 'service'
    lastRead: { type: Date, default: Date.now }
  }],
  lastMessage: {
    content: String,
    sender: String,
    timestamp: { type: Date, default: Date.now }
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ChatRoom', chatRoomSchema); 