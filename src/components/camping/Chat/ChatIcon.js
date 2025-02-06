"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import ChatWindow from "./ChatWindow";
import io from "socket.io-client";
import "@/styles/pages/booking/chat.css";

const ChatIcon = () => {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [socket, setSocket] = useState(null);

  const handleChatClick = () => {
    if (!session?.user) {
      signIn();
      return;
    }

    if (!socket) {
      // 修改這裡的 Socket.IO 配置
      const SOCKET_URL =
        process.env.NODE_ENV === "production"
          ? "https://camping-platform-production.up.railway.app" // 確保這是完整的 URL
          : "http://localhost:3002";

      const newSocket = io(SOCKET_URL, {
        path: "/socket.io/",
        withCredentials: true,
        query: {
          userId: session.user.id,
          userType: "member",
          roomId: `user_${session.user.id}`,
        },
        transports: ["websocket", "polling"],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
      });

      // 添加連接監聽器
      newSocket.on("connect", () => {
        console.log("Socket 連接成功");
      });

      newSocket.on("connect_error", (error) => {
        console.error("Socket 連接錯誤:", error);
      });

      setSocket(newSocket);
    }

    setIsOpen(true);
  };

  return (
    <div className="fixed right-0 top-[60%] z-[2]">
      {!isOpen && (
        <button
          onClick={handleChatClick}
          className={`
            flex flex-col items-center gap-2
            bg-[#6B8E7B] text-white
            px-4 py-3
            hover:bg-[#5F7A68]
            transition-all duration-300
            rounded-l-lg
            shadow-lg
            translate-x-0 hover:-translate-x-1
          `}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
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
          <span 
            className="text-sm font-medium"
            style={{ writingMode: 'vertical-rl', textOrientation: 'upright' }}
          >
            線上客服
          </span>
        </button>
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
