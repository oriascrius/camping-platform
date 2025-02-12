const { v4: uuidv4 } = require('uuid');
const pool = require('../models/connection');
const BaseHandler = require('./BaseHandler');

class NotifyHandler extends BaseHandler {
  constructor(io, socket, connections) {
    super(io, socket, connections);
    this.initialize();
  }

  initialize() {
    this.subscribeToNotificationChannel();
    this.on('getNotifications', this.handleGetNotifications);
    this.on('markAsRead', this.handleMarkAsRead);
    this.on('markAllAsRead', this.handleMarkAllAsRead);
    this.on('deleteNotifications', this.handleDeleteNotifications);
  }

  subscribeToNotificationChannel() {
    const channel = this.userType === 'admin' 
      ? 'admin-notifications' 
      : `user-notifications-${this.userId}`;
    
    this.logDebug('訂閱通知頻道', { channel });
    this.socket.join(channel);
    this.logInfo('通知頻道訂閱成功', { channel });
  }

  async handleGetNotifications() {
    try {
      this.logDebug('獲取通知列表');
      // 獲取通知邏輯...
      this.logInfo('通知列表獲取成功', { 
        count: notifications?.length 
      });
    } catch (error) {
      this.logError('獲取通知列表失敗', error);
      throw error;
    }
  }

  async handleMarkAsRead(notificationId) {
    try {
      this.logDebug('標記通知已讀', { notificationId });
      // 標記已讀邏輯...
      this.logInfo('通知標記已讀成功', { notificationId });
    } catch (error) {
      this.logError('標記通知已讀失敗', error, { notificationId });
      throw error;
    }
  }

  async cleanup() {
    try {
      const channel = this.userType === 'admin' 
        ? 'admin-notifications' 
        : `user-notifications-${this.userId}`;
      
      this.logInfo('清理通知資源', { channel });
      await this.socket.leave(channel);
      this.logDebug('已取消訂閱通知頻道', { channel });
    } catch (error) {
      this.logError('清理通知資源失敗', error);
    }
  }
}

module.exports = (io, socket, connections) => new NotifyHandler(io, socket, connections);
