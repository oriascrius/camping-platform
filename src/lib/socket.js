import { io } from 'socket.io-client';

// 創建 Socket.IO 客戶端實例
const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3002', {
  path: '/socket.io/',
  transports: ['websocket', 'polling'],
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});

// 監聽連接事件
socket.on('connect', () => {
  console.log('已連接到 WebSocket 服務器');
});

// 監聽錯誤
socket.on('connect_error', (error) => {
  console.error('WebSocket 連接錯誤:', error);
});

export default socket; 