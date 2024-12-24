const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  adminId: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['waiting', 'active', 'closed'],
    default: 'waiting'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastMessage: {
    text: String,
    timestamp: Date,
    sender: String
  }
});

module.exports = mongoose.model('ChatRoom', chatRoomSchema); 