'use client'; // 因為需要使用客戶端功能，例如 useEffect

import { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:4000'); // 連接到後端

export default function ChatRoom() {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [status, setStatus] = useState('online');
  const [isJoined, setIsJoined] = useState(false);

  // 初始化 Socket.IO 監聽
  useEffect(() => {
    socket.on('message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('userList', (userList) => {
      setUsers(userList.map(([id, data]) => ({ id, ...data })));
    });

    return () => {
      socket.off('message');
      socket.off('userList');
    };
  }, []);

  // 加入聊天室
  const joinChat = () => {
    if (username) {
      socket.emit('join', username);
      setIsJoined(true);
    }
  };

  // 發送訊息
  const sendMessage = () => {
    if (message) {
      socket.emit('sendMessage', message);
      setMessage('');
    }
  };

  // 更新狀態
  const updateStatus = (newStatus) => {
    setStatus(newStatus);
    socket.emit('updateStatus', newStatus);
  };

  if (!isJoined) {
    return (
      <div>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="輸入你的使用者名稱"
        />
        <button onClick={joinChat}>加入聊天室</button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '20px' }}>
      {/* 聊天訊息區塊 */}
      <div style={{ width: '70%' }}>
        <h2>聊天室</h2>
        <div style={{ height: '300px', overflowY: 'scroll', border: '1px solid #ccc' }}>
          {messages.map((msg, index) => (
            <p key={index}>
              <strong>{msg.username}</strong>: {msg.text} <small>{new Date(msg.timestamp).toLocaleTimeString()}</small>
            </p>
          ))}
        </div>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="輸入訊息"
        />
        <button onClick={sendMessage}>發送</button>
      </div>

      {/* 使用者清單區塊 */}
      <div style={{ width: '30%' }}>
        <h2>使用者清單</h2>
        <select value={status} onChange={(e) => updateStatus(e.target.value)}>
          <option value="online">在線</option>
          <option value="busy">忙碌</option>
          <option value="offline">離線</option>
        </select>
        <ul>
          {users.map((user) => (
            <li key={user.id}>
              {user.username} - {user.status}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}