'use client';
import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { useSession } from 'next-auth/react';
import io from 'socket.io-client';

export default function AdminChatModal({ isOpen, onClose, roomId, socket: initialSocket, room }) {
  const { data: session } = useSession();
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const lastMessageRef = useRef(null); // 用來追蹤最後一條訊息
  const [error, setError] = useState('');
  const [chatRoom, setChatRoom] = useState(room);
  const messageProcessingRef = useRef(false); // 新增：追蹤訊息處理狀態
  const [socketConnected, setSocketConnected] = useState(false); // 新增
  const [socket] = useState(initialSocket);

  // 如果沒有 room 資料，則從 API 獲取
  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        const response = await fetch(`/api/admin/chat-rooms/${roomId}`);
        if (response.ok) {
          const data = await response.json();
          setChatRoom(data.room);
        }
      } catch (error) {
        console.error('獲取聊天室資料失敗:', error);
      }
    };

    if (!chatRoom && roomId) {
      fetchRoomData();
    }
  }, [roomId, chatRoom]);

  // 載入聊天記錄
  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // 每5秒更新一次
    return () => clearInterval(interval);
  }, [roomId]);

  // 自動滾動到最新訊息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 初始化 Socket
  useEffect(() => {
    console.log('初始化 Socket:', { initialSocket, roomId, session });
    
    if (!socket && session?.user) {
      const newSocket = io('http://localhost:3002', {
        withCredentials: true,
        query: {
          userId: session.user.id,
          userType: 'admin'
        }
      });

      newSocket.on('connect', () => {
        console.log('Socket 已連接');
        // 加入房間
        newSocket.emit('joinRoom', {
          userId: session.user.id,
          roomId: roomId,
          userType: 'admin'
        });
      });

      setSocket(newSocket);
    }
  }, [session, roomId]);

  // 監聽訊息
  useEffect(() => {
    if (socket) {
      socket.on('adminMessage', (newMessage) => {
        console.log('收到會員訊息:', newMessage);
        setMessages(prev => [...prev, newMessage]);
      });

      return () => {
        socket.off('adminMessage');
      };
    }
  }, [socket]);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/admin/messages/${roomId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      // 確保每條訊息的 sender_type 是正確的
      const processedMessages = data.messages.map(msg => ({
        ...msg,
        senderType: msg.sender_type // 確保使用資料庫中的 sender_type
      }));
      setMessages(processedMessages);
      
    } catch (error) {
      console.error('獲取訊息失敗:', error);
      setError(error.message);
    }
  };

  // 發送訊息
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !socket?.connected) return;

    try {
      const messageData = {
        userId: session.user.id,
        message: newMessage.trim(),
        senderType: 'admin',
        roomId: roomId,
        timestamp: new Date().toISOString()
      };

      console.log('管理員發送訊息:', messageData);
      socket.emit('message', messageData);

      // 更新本地訊息列表時保持一致的格式
      const newMessageObj = {
        id: Date.now().toString(),
        room_id: roomId,
        user_id: session.user.id,
        sender_type: 'admin', // 使用與資料庫一致的欄位名稱
        senderType: 'admin',  // 為了前端顯示
        message: newMessage.trim(),
        message_type: 'text',
        status: 'sent',
        created_at: messageData.timestamp
      };
      
      setMessages(prev => [...prev, newMessageObj]);
      setNewMessage('');

    } catch (error) {
      console.error('發送訊息錯誤:', error);
    }
  };

  // 格式化時間
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleClose = () => {
    try {
      if (socket) {
        socket.disconnect();
      }
      onClose();
    } catch (error) {
      console.error('關閉聊天視窗錯誤:', error);
    }
  };

  // 處理表單提交
  const handleSubmit = async (e) => {
    e.preventDefault(); // 防止表單預設提交行為
    await handleSendMessage(e);
  };

  // 添加滾動到底部的函數
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 當消息更新時自動滾動
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-md rounded-lg shadow-lg">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">客服聊天室</h3>
            <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>
        </div>

        <div className="h-96 overflow-y-auto p-4">
          {messages.map((msg) => (
            <div key={msg.id} 
                 className={`flex ${(msg.sender_type === 'admin' || msg.senderType === 'admin') ? 'justify-end' : 'justify-start'} mb-4`}>
              <div className={`max-w-[70%] ${
                (msg.sender_type === 'admin' || msg.senderType === 'admin')
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200'
              } rounded-lg px-4 py-2`}>
                <div>{msg.message}</div>
                <div className="text-xs text-right mt-1">
                  {new Date(msg.created_at).toLocaleTimeString('zh-TW', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="p-4 border-t">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 border rounded-lg px-3 py-2"
              placeholder="輸入訊息..."
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || !socket?.connected}
              className={`px-4 py-2 rounded-lg ${
                newMessage.trim() && socket?.connected
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              發送
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 