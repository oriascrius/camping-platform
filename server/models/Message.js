const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  roomId: String,
  sender: {
    id: String,
    role: String
  },
  content: String,
  type: String, // 'text', 'image', 'file'
  status: String, // 'sent', 'delivered', 'read'
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema); 