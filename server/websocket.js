const socketIO = require('socket.io');
const pool = require('./config/database');
const { v4: uuidv4 } = require('uuid');
const Message = require('./models/Message');

function initializeWebSocket(io) {
  io.on('connection', (socket) => {
    console.log('用戶連接成功:', socket.user.name);
    
    // 加入聊天室
    socket.on('join_room', async (data) => {
      try {
        const { roomId } = data;
        socket.join(roomId);
        
        // 載入歷史消息
        const messages = await Message.find({ roomId })
          .sort({ createdAt: -1 })
          .limit(50);
          
        socket.emit('load_messages', messages.reverse());
      } catch (error) {
        console.error('加入聊天室錯誤:', error);
      }
    });

    // 發送消息
    socket.on('send_message', async (data) => {
      try {
        const message = new Message({
          roomId: data.roomId,
          sender: {
            id: socket.user.id,
            role: socket.user.role
          },
          content: data.message,
          type: 'text'
        });

        await message.save();
        io.to(data.roomId).emit('new_message', message);
      } catch (error) {
        console.error('發送消息錯誤:', error);
      }
    });
  });
}