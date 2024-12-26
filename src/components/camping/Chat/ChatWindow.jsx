'use client';
import { useState, useEffect, useRef } from 'react';
import { useSession, signIn } from 'next-auth/react';
import '@/styles/pages/booking/chat.css';
import io from 'socket.io-client';

const ChatWindow = ({ socket: initialSocket, onClose }) => {
  const { data: session } = useSession();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState(null);

  // 添加格式化時間的函數
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 初始化 Socket 和 RoomId
  useEffect(() => {
    if (session?.user) {
      // 先設置房間 ID
      const userRoomId = `user_${session.user.id}`;
      setRoomId(userRoomId);
      console.log('設置 roomId:', userRoomId);

      if (!socket) {
        const newSocket = io('http://localhost:3002', {
          withCredentials: true,
          query: {
            userId: session.user.id,
            userType: 'member',
            roomId: userRoomId
          }
        });

        newSocket.on('connect', () => {
          console.log('Socket 已連接');
          // 修正這裡的資料格式
          newSocket.emit('joinRoom', {
            userId: session.user.id,
            roomId: userRoomId,  // 這裡要加上
            userType: 'member'
          });
        });

        setSocket(newSocket);
      }
    }
  }, [session]);

  // 監聽訊息
  useEffect(() => {
    if (!socket) return;

    // 監聽來自管理員的訊息
    socket.on('adminMessage', (message) => {
      console.log('收到管理員訊息:', message);
      setMessages(prev => {
        console.log('更新前的訊息:', prev);
        const newMessages = [...prev, message];
        console.log('更新後的訊息:', newMessages);
        return newMessages;
      });
    });

    // 監聽來自會員的訊息
    socket.on('memberMessage', (message) => {
      console.log('收到會員訊息:', message);
      setMessages(prev => {
        console.log('更新前的訊息:', prev);
        const newMessages = [...prev, message];
        console.log('更新後的訊息:', newMessages);
        return newMessages;
      });
    });

    // 監聽歷史訊息
    socket.on('chatHistory', (history) => {
      console.log('收到歷史訊息:', history);
      setMessages(history);
    });

    // 監聽錯誤
    socket.on('error', (error) => {
      console.error('Socket 錯誤:', error);
    });

    return () => {
      socket.off('adminMessage');
      socket.off('memberMessage');
      socket.off('chatHistory');
      socket.off('error');
    };
  }, [socket]);

  // 發送訊息
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !socket || !roomId) return;

    try {
      const messageData = {
        userId: session.user.id,
        message: message.trim(),
        senderType: 'member',
        roomId: roomId,
        timestamp: new Date().toISOString()
      };

      console.log('發送訊息:', messageData);
      socket.emit('message', messageData);
      setMessage('');
    } catch (error) {
      console.error('發送訊息錯誤:', error);
    }
  };

  // 渲染訊息
  const renderMessage = (msg) => {
    const isMember = msg.senderType === 'member';
    return (
      <div key={msg.id} 
           className={`message ${isMember ? 'user' : 'admin'}`}>
        <div className="message-content">
          <div className="message-bubble">
            {msg.message}
            <span className="message-time">
              {formatTime(msg.created_at)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed bottom-20 right-4 w-80 bg-white rounded-lg shadow-lg">
      <div className="chat-header">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold">客服聊天室</h3>
          <button onClick={onClose}>✕</button>
        </div>
      </div>

      <div className="h-96 overflow-y-auto p-4">
        {messages.map((msg, index) => (
          <div
            key={msg.id || index}
            className={`mb-2 ${
              msg.sender_type === 'admin' ? 'text-left' : 'text-right'
            }`}
          >
            <div
              className={`inline-block p-2 rounded-lg ${
                msg.sender_type === 'admin'
                  ? 'bg-gray-200'
                  : 'bg-blue-500 text-white'
              }`}
            >
              {msg.message}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {new Date(msg.created_at).toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      <div className="chat-input">
        <form onSubmit={handleSendMessage}>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="輸入訊息..."
          />
          <button type="submit" disabled={!message.trim()}>
            發送
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow; 