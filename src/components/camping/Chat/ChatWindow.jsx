'use client';
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import '@/styles/pages/booking/chat.css';

const ChatWindow = ({ socket: initialSocket, onClose }) => {
  const { data: session } = useSession();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [isJoined, setIsJoined] = useState(false);
  const messagesEndRef = useRef(null);

  // 初始化 Socket 和 RoomId
  useEffect(() => {
    if (session?.user && initialSocket && !isJoined) {
      const userRoomId = `user_${session.user.id}`;
      setRoomId(userRoomId);
      setSocket(initialSocket);
      
      console.log('準備加入房間:', userRoomId);
      initialSocket.emit('joinRoom', {
        userId: session.user.id,
        roomId: userRoomId,
        userType: 'member'
      });
      
      setIsJoined(true);
    }
  }, [session, initialSocket, isJoined]);

  // 監聽訊息
  useEffect(() => {
    if (!socket) return;

    // 監聽一般訊息
    socket.on('message', (newMessage) => {
      console.log('收到新訊息:', newMessage);
      setMessages(prev => [...prev, newMessage]);
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
      socket.off('message');
      socket.off('chatHistory');
      socket.off('error');
    };
  }, [socket]);

  // 自動滾動到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 發送訊息
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !socket || !roomId) return;

    try {
      const messageData = {
        userId: session.user.id,
        message: message.trim(),
        senderType: 'member',
        roomId: roomId
      };

      console.log('發送訊息:', messageData);
      socket.emit('message', messageData);
      setMessage('');
    } catch (error) {
      console.error('發送訊息錯誤:', error);
    }
  };

  return (
    <div className="fixed bottom-20 right-4 w-80 bg-white rounded-lg shadow-lg">
      <div className="chat-header">
        <div className="flex justify-between items-center p-3 border-b">
          <h3 className="font-semibold">客服聊天室</h3>
          <button onClick={onClose}>✕</button>
        </div>
      </div>

      <div className="h-96 overflow-y-auto p-4">
        {messages.map((msg, index) => (
          <div
            key={msg.id || index}
            className={`mb-4 flex ${
              msg.sender_type === 'member' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                msg.sender_type === 'member'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              <p className="break-words">{msg.message}</p>
              <div className={`text-xs mt-1 ${
                msg.sender_type === 'member' ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {new Date(msg.created_at).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input border-t p-3">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="輸入訊息..."
            className="flex-1 p-2 border rounded"
          />
          <button
            type="submit"
            disabled={!message.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
          >
            發送
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow; 