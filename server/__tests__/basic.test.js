const path = require('path');  // 先引入 path 模組

require('dotenv').config({ 
  path: path.resolve(__dirname, '../../.env.local')  // 指定 .env.local
});
const { createServer } = require('http');
const { Server } = require('socket.io');
const Client = require('socket.io-client');
const express = require('express');

describe('伺服器基本測試', () => {
  let app, server, io, clientSocket;

  beforeAll((done) => {
    app = express();
    server = createServer(app);
    io = new Server(server, {
      cors: {
        origin: process.env.NEXT_PUBLIC_FRONTEND_URL,  // 使用環境變數
        methods: ["GET", "POST"]
      }
    });

    server.listen(0, () => {
      const port = server.address().port;
      console.log(`Test server running on port ${port}`);
      
      clientSocket = Client(`http://localhost:${port}`);

      io.on('connection', (socket) => {
        console.log('Server received connection');
        
        socket.on('join', (room) => {
          socket.join(room);
          socket.emit('joined', room);
        });

        socket.on('message', (data) => {
          io.to(data.room).emit('message', data);
        });
      });

      clientSocket.on('connect', done);
    });
  });

  afterAll((done) => {
    if (clientSocket) {
      clientSocket.disconnect();
    }
    if (io) {
      io.close();
    }
    if (server) {
      server.close(done);
    }
  });

  test('應該可以連接到伺服器', () => {
    expect(clientSocket.connected).toBe(true);
  });

  test('應該可以加入房間', (done) => {
    clientSocket.emit('join', 'test-room');
    clientSocket.on('joined', (room) => {
      expect(room).toBe('test-room');
      done();
    });
  });

  test('應該可以在房間內發送和接收訊息', (done) => {
    const testMessage = {
      room: 'test-room',
      text: 'Hello World'
    };

    clientSocket.on('message', (data) => {
      expect(data).toEqual(testMessage);
      done();
    });

    clientSocket.emit('message', testMessage);
  });

  test('應該已載入環境變數', () => {
    const requiredEnvVars = [
      'GEMINI_API_KEY',
      'NEXT_PUBLIC_FRONTEND_URL',
      'NEXT_PUBLIC_SOCKET_URL'
    ];

    requiredEnvVars.forEach(envVar => {
      expect(process.env[envVar]).toBeDefined();
    });
  });
});
