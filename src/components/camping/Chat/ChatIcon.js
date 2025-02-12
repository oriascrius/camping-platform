"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import ChatWindow from "./ChatWindow";
import io from "socket.io-client";
import { motion } from "framer-motion";
import "@/styles/pages/booking/chat.css";
import SocketManager from '@/utils/socketManager';

const ChatIcon = () => {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [socket, setSocket] = useState(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (session?.user && !socket) {
      try {
        const socketManager = SocketManager.getInstance();
        const newSocket = socketManager.connect({
          query: {
            userId: session.user.id,
            userType: session.user.isAdmin ? "admin" : session.user.isOwner ? "owner" : "member",
            senderType: session.user.isAdmin ? "admin" : session.user.isOwner ? "owner" : "member",
            chatRoomId: `chat_${session.user.id}`,
            notificationRoomId: `notification_${session.user.id}`
          }
        });

        // 連接事件監聽
        newSocket.on("connect", () => {
          if (newSocket.io.engine.transport.name !== 'websocket') {
            console.log('非 WebSocket 連接，斷開重連');
            newSocket.disconnect();
            newSocket.connect();
            return;
          }
          
          console.log("✅ Socket 連接成功", {
            id: newSocket.id,
            transport: newSocket.io.engine.transport.name
          });
        });

        // 重連事件
        newSocket.on("reconnect_attempt", (attempt) => {
          console.log(`嘗試重新連接 (${attempt})`);
        });

        newSocket.on("reconnect", (attempt) => {
          console.log(`重新連接成功 (嘗試次數: ${attempt})`);
        });

        // 斷開連接處理
        newSocket.on("disconnect", (reason) => {
          console.log("Socket 斷開連接:", reason);
          if (reason === "io server disconnect") {
            console.log("服務器斷開連接，嘗試重新連接...");
            newSocket.connect();
          }
        });

        // 錯誤處理
        newSocket.on("connect_error", (error) => {
          console.error("Socket 連接錯誤:", error.message);
        });

        setSocket(newSocket);

        // 清理函數
        return () => {
          console.log('清理 Socket 連接...');
          if (newSocket) {
            newSocket.off('connect');
            newSocket.off('disconnect');
            newSocket.off('reconnect_attempt');
            newSocket.off('reconnect');
            newSocket.off('connect_error');
          }
        };

      } catch (error) {
        console.error("Socket 初始化錯誤:", error);
      }
    }
  }, [session]);

  // 組件卸載時的清理
  useEffect(() => {
    return () => {
      if (socket) {
        console.log('組件卸載，關閉 Socket 連接');
        socket.close();
      }
    };
  }, [socket]);

  const handleChatClick = () => {
    if (!session?.user) {
      signIn();
      return;
    }
    setIsOpen(true);
  };

  return (
    <div className="fixed right-0 top-[60%] z-[2]">
      {!isOpen && (
        <motion.div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          animate={{
            width: isHovered ? "auto" : "36px",
            backgroundColor: isHovered ? "#5F7A68" : "#6B8E7B",
          }}
          initial={{
            width: "36px",
          }}
          transition={{
            duration: 0.3,
            ease: "easeInOut"
          }}
          className="relative"
        >
          <button
            onClick={handleChatClick}
            className={`
              flex items-center gap-2
              text-white
              px-[12px] py-2
              rounded-l-lg
              shadow-lg
              transition-all duration-300
              hover:-translate-x-1
              overflow-hidden
              whitespace-nowrap
              w-full
            `}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ 
                opacity: isHovered ? 1 : 0,
                width: isHovered ? "auto" : 0
              }}
              transition={{ duration: 0.2 }}
              className="text-sm font-medium ml-1"
            >
              線上客服
            </motion.span>
          </button>
        </motion.div>
      )}

      {isOpen && (
        <div className="fixed right-0 top-[300px] max-h-[calc(100vh-180px)] z-[2]">
          <ChatWindow
            socket={socket}
            onClose={() => setIsOpen(false)}
            className="w-[350px] h-[505px] bg-white shadow-xl border-l border-gray-200"
          />
        </div>
      )}
    </div>
  );
};

export default ChatIcon;
