const BaseHandler = require('./BaseHandler');

class ChatHandler extends BaseHandler {
  constructor(io, socket, connections) {
    super(io, socket, connections);
    this.initialize();
  }

  initialize() {
    this.on('joinRoom', this.handleJoinRoom);
    this.on('sendMessage', this.handleSendMessage);
    this.on('markMessagesAsRead', this.handleMarkMessagesAsRead);
  }

  async handleJoinRoom(data) {
    try {
      const { roomId } = data;
      this.logInfo('加入聊天室', { roomId });
      
      // 離開當前房間
      if (this.currentRoom) {
        await this.socket.leave(this.currentRoom);
        this.logDebug('離開原聊天室', { oldRoom: this.currentRoom });
      }

      // 加入新房間
      await this.socket.join(roomId);
      this.currentRoom = roomId;
      
      this.logInfo('成功加入聊天室', { roomId });
    } catch (error) {
      this.logError('加入聊天室失敗', error, { roomId: data?.roomId });
      throw error;
    }
  }

  async handleSendMessage(data) {
    try {
      const { roomId, message } = data;
      this.logDebug('發送訊息', { 
        roomId, 
        messageLength: message?.length,
        messageType: message?.type 
      });

      // 訊息處理邏輯...

      this.logInfo('訊息發送成功', { 
        roomId,
        messageId: message?.id 
      });
    } catch (error) {
      this.logError('訊息發送失敗', error, { 
        roomId: data?.roomId 
      });
      throw error;
    }
  }

  async handleMarkMessagesAsRead(data) {
    // 處理標記已讀邏輯
  }

  async cleanup() {
    try {
      if (this.currentRoom) {
        this.logInfo('清理聊天室資源', { roomId: this.currentRoom });
        await this.socket.leave(this.currentRoom);
        this.logDebug('已離開聊天室', { roomId: this.currentRoom });
      }
    } catch (error) {
      this.logError('清理聊天室資源失敗', error);
    }
  }
}

module.exports = (io, socket, connections) => new ChatHandler(io, socket, connections);
