import { useEffect, useState } from 'react';
import io from 'socket.io-client';

const Chat = () => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  
  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);
    
    // 連接聊天室
    newSocket.emit('join_room', 'customer_service');
    
    // 監聽新訊息
    newSocket.on('receive_message', (message) => {
      setMessages((prev) => [...prev, message]);
    });
    
    return () => newSocket.close();
  }, []);
  
  const sendMessage = () => {
    if (inputMessage.trim()) {
      socket.emit('send_message', {
        roomId: 'customer_service',
        sender: 'user',
        message: inputMessage
      });
      setInputMessage('');
    }
  };
  
  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>
            {msg.message}
          </div>
        ))}
      </div>
      <div className="input-area">
        <input 
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="輸入訊息..."
        />
        <button onClick={sendMessage}>發送</button>
      </div>
    </div>
  );
}; 