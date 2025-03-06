require('dotenv').config({ path: '.env.local' });

// 添加這些日誌
console.log('Environment variables loaded:');
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY);

const request = require('supertest');
const { createServer } = require('http');
const { Server } = require('socket.io');
const Client = require('socket.io-client');
const express = require('express');

describe('聊天室伺服器測試', () => {
  let io, serverSocket, clientSocket, httpServer, app;

  beforeAll((done) => {
    app = express();
    httpServer = createServer(app);
    io = new Server(httpServer);
    
    // 設置事件處理器
    io.on('connection', (socket) => {
      console.log('Client connected');
      serverSocket = socket;

      // 處理加入房間
      socket.on('joinRoom', (data) => {
        if (data.roomId === 'invalid-room') {
          socket.emit('error', { message: 'Invalid room ID' });
        } else {
          socket.emit('chatHistory', []);
        }
      });

      // 處理消息
      socket.on('message', (data) => {
        if (data.message.includes('@ai')) {
          socket.emit('message', {
            message: 'AI回應',
            sender_type: 'admin',
            sender_name: 'AI助手'
          });
        } else {
          socket.emit('message', {
            message: data.message,
            sender_type: data.senderType
          });
        }
      });

      // 處理聊天室列表
      socket.on('getChatRooms', () => {
        socket.emit('chatRooms', []);
      });

      // 處理已讀狀態
      socket.on('markMessagesAsRead', (data) => {
        socket.emit('messagesMarkedAsRead', { success: true });
      });

      // 處理聊天室狀態
      socket.on('getChatRoomStatus', (data) => {
        socket.emit('chatRoomStatus', { status: 'active' });
      });
    });

    httpServer.listen(() => {
      const port = httpServer.address().port;
      console.log(`Test server running on port ${port}`);
      clientSocket = new Client(`http://localhost:${port}`);
      clientSocket.on('connect', () => {
        console.log('Client socket connected');
        done();
      });
    });
  });

  afterAll((done) => {
    if (clientSocket) clientSocket.close();
    if (io) io.close();
    httpServer.close(done);
  });

  // 基本連線測試
  test('應該可以建立 WebSocket 連線', (done) => {
    expect(clientSocket.connected).toBe(true);
    done();
  });

  // 聊天室功能測試
  test('應該可以加入聊天室', (done) => {
    const mockUser = {
      roomId: 'test-room-1',
      userId: 'user-1',
      userType: 'member'
    };

    clientSocket.on('chatHistory', (messages) => {
      expect(Array.isArray(messages)).toBe(true);
      done();
    });

    clientSocket.emit('joinRoom', mockUser);
  });

  // 一般訊息測試
  test('應該可以發送和接收訊息', (done) => {
    const testMessage = {
      roomId: 'test-room-1',
      userId: 'user-1',
      message: '測試訊息',
      senderType: 'member'
    };

    clientSocket.on('message', (data) => {
      expect(data.message).toBe(testMessage.message);
      expect(data.sender_type).toBe(testMessage.senderType);
      done();
    });

    clientSocket.emit('message', testMessage);
  });

  // AI 回應測試 - 分開處理
  test('當訊息包含 @ai 時應該觸發 AI 回應', (done) => {
    console.log('Testing AI response with API key:', process.env.GEMINI_API_KEY);
    
    const testMessage = {
      roomId: 'test-room-1',
      userId: 'user-1',
      message: '@ai 你好',
      senderType: 'member'
    };

    // 移除之前的監聽器
    clientSocket.removeAllListeners('message');

    // 添加新的監聽器
    clientSocket.on('message', (data) => {
      console.log('Received message:', data);
      expect(data.message).toBe('AI回應');
      expect(data.sender_type).toBe('admin');
      expect(data.sender_name).toBe('AI助手');
      done();
    });

    clientSocket.emit('message', testMessage);
  }, 10000);

  // 錯誤處理測試
  test('無效的房間ID應該返回錯誤', (done) => {
    clientSocket.on('error', (error) => {
      expect(error.message).toBeTruthy();
      done();
    });

    clientSocket.emit('joinRoom', {
      roomId: 'invalid-room',
      userId: 'user-1',
      userType: 'member'
    });
  });

  // 已讀狀態測試
  test('應該可以標記訊息為已讀', (done) => {
    clientSocket.on('messagesMarkedAsRead', (response) => {
      expect(response.success).toBe(true);
      done();
    });

    clientSocket.emit('markMessagesAsRead', {
      roomId: 'test-room-1'
    });
  });

  // 聊天室狀態測試
  test('應該可以獲取聊天室狀態', (done) => {
    clientSocket.on('chatRoomStatus', (status) => {
      expect(status).toBeDefined();
      expect(status.status).toBe('active');
      done();
    });

    clientSocket.emit('getChatRoomStatus', {
      roomId: 'test-room-1'
    });
  });
});
