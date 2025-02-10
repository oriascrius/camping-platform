"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import ChatWindow from "./ChatWindow";
import io from "socket.io-client";
import { motion } from "framer-motion";
import "@/styles/pages/booking/chat.css";

const ChatIcon = () => {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [socket, setSocket] = useState(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (session?.user && !socket) {
      const SOCKET_URL =
        process.env.NODE_ENV === "production"
          ? "https://camping-platform-production.up.railway.app"
          : "http://localhost:3002";

      try {
        const newSocket = io(SOCKET_URL, {
          path: "/socket.io/",
          withCredentials: true,
          query: {
            userId: session.user.id,
            userType: "member",
            senderType: "member",
            roomId: `chat_${session.user.id}`,
          },
          transports: ['polling', 'websocket'],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          timeout: 20000,
          forceNew: true,
        });

        newSocket.on("connect", () => {
          console.log("Socket 連接成功，ID:", newSocket.id);
          console.log("Transport:", newSocket.io.engine.transport.name);
        });

        newSocket.on("connect_error", (error) => {
          console.error("Socket 連接錯誤:", error.message);
        });

        newSocket.on("disconnect", (reason) => {
          console.log("Socket 斷開連接:", reason);
        });

        newSocket.on("error", (error) => {
          console.error("Socket 錯誤:", error);
        });

        newSocket.on('message', () => {
          if (isOpen) {
            const chatContainer = document.querySelector('.chat-messages-container');
            if (chatContainer) {
              setTimeout(() => {
                chatContainer.scrollTop = chatContainer.scrollHeight;
              }, 100);
            }
          }
        });

        setSocket(newSocket);
      } catch (error) {
        console.error("Socket 初始化錯誤:", error);
      }
    }

    return () => {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    };
  }, [session, isOpen]);

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
