"use client";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import ChatWindow from "./ChatWindow";
import io from "socket.io-client";
import { motion, useDragControls } from "framer-motion";
import { IoClose } from "react-icons/io5";
import "@/styles/pages/booking/chat.css";

const ChatIcon = () => {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [socket, setSocket] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragControls = useDragControls();
  const chatWindowRef = useRef(null);

  // 使用 useEffect 來管理 socket 連接
  useEffect(() => {
    if (session?.user && !socket) {
      const SOCKET_URL =
        process.env.NODE_ENV === "production"
          ? "https://camping-platform-production.up.railway.app"
          : "http://localhost:3002";

      const newSocket = io(SOCKET_URL, {
        path: "/socket.io/",
        withCredentials: true,
        query: {
          userId: session.user.id,
          userType: "member",
        },
        transports: ["websocket"],  // 只使用 websocket
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
      });

      newSocket.on("connect", () => {
        console.log("Socket 連接成功, ID:", newSocket.id);
      });

      newSocket.on("connect_error", (error) => {
        console.error("Socket 連接錯誤:", error);
      });

      setSocket(newSocket);

      // 清理函數
      return () => {
        // console.log("清理 socket 連接");
        if (newSocket) {
          newSocket.disconnect();
          setSocket(null);
        }
      };
    }
  }, [session?.user?.id]); // 只依賴 userId

  // 新增點擊外部關閉的 effect
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && 
          chatWindowRef.current && 
          !chatWindowRef.current.contains(event.target) &&
          !event.target.closest('.chat-trigger')) {  // 排除觸發按鈕
        handleClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleChatClick = () => {
    if (!session?.user) {
      signIn();
      return;
    }
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setPosition({ x: 0, y: 0 });
  };

  const startDragging = (event) => {
    dragControls.start(event);
  };

  return (
    <div className="fixed right-0 top-[60%] z-[9999]">
      {!isOpen && (
        <motion.div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          animate={{
            width: isHovered ? "auto" : "36px",
            backgroundColor: isHovered ? "#5F7A68" : "#6B8E7B",
          }}
          initial={{ width: "36px" }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="relative chat-trigger"
        >
          <button
            onClick={handleChatClick}
            className="flex items-center gap-2 text-white px-[12px] py-2 rounded-l-lg shadow-lg
              transition-all duration-300 hover:-translate-x-1 overflow-hidden whitespace-nowrap w-full"
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

      {isOpen && socket && (
        <motion.div
          ref={chatWindowRef}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ 
            opacity: 1, 
            scale: 1, 
            y: 0,
            x: position.x,
            y: position.y
          }}
          drag
          dragControls={dragControls}
          dragListener={false}
          dragMomentum={false}
          dragElastic={0}
          dragConstraints={{
            top: -300,
            left: -800,
            right: 0,
            bottom: 300
          }}
          onDragEnd={(event, info) => {
            setPosition({
              x: position.x + info.offset.x,
              y: position.y + info.offset.y
            });
          }}
          className="fixed right-0 top-[150px] z-[2]"
        >
          <div className="
            w-full sm:w-[90vw] md:w-[600px] lg:w-[37.5rem] 
            h-[80vh] md:h-[40.375rem]
            bg-white shadow-xl border border-gray-200 
            flex flex-col rounded-2xl overflow-hidden
            mx-2 sm:mx-0
          ">
            {/* 標題欄 */}
            <div 
              className="chat-header bg-gradient-to-br from-[#6B8E7B] to-[#5F7A68] text-white p-2 cursor-move select-none flex-shrink-0"
              onPointerDown={startDragging}
            >
              <div className="flex justify-between items-center px-2">
                <motion.div 
                  className="flex items-center gap-2"
                  initial={false}
                  animate={{ x: 0 }}
                  whileHover={{ x: 3 }}
                >
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse relative">
                    <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75"></div>
                  </div>
                  <div className="flex flex-col ms-2">
                    <span className="font-medium">智能客服中心</span>
                    <span className="text-xs text-green-100 hidden sm:block">24小時線上服務</span>
                  </div>
                </motion.div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-green-100 hidden sm:block">輸入 @ai 可呼叫智能客服助理</span>
                  <button
                    onClick={handleClose}
                    className="hover:bg-black/10 p-1 rounded-full transition-colors"
                  >
                    <IoClose className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* 聊天視窗主體 - 添加全局滾動條樣式 */}
            <div className="
              flex-1 overflow-y-auto
              [&::-webkit-scrollbar]:!w-1.5
              [&::-webkit-scrollbar-track]:!bg-transparent
              [&::-webkit-scrollbar-thumb]:!bg-[#6B8E7B]/30
              [&::-webkit-scrollbar-thumb]:!rounded-full
              [&::-webkit-scrollbar-thumb]:!border-2
              [&::-webkit-scrollbar-thumb]:!border-transparent
              [&::-webkit-scrollbar-thumb]:!bg-clip-padding
              hover:[&::-webkit-scrollbar-thumb]:!bg-[#6B8E7B]/50
              scrollbar-thin
              scrollbar-thumb-[#6B8E7B]/30
              scrollbar-track-transparent
              hover:scrollbar-thumb-[#6B8E7B]/50
              transition-colors
            ">
              <ChatWindow
                socket={socket}
                onClose={handleClose}
                className="h-full"
              />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ChatIcon;
