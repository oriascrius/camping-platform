"use client";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { BellIcon } from "@heroicons/react/24/outline";
import {
  BellIcon as BellIconSolid,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  CheckCircleIcon,
  TrashIcon,
} from "@heroicons/react/24/solid";
import {
  showConfirm,
  showError,
  showNotificationAlert,
} from "@/utils/sweetalert";
import io from "socket.io-client";
import Swal from "sweetalert2";
import { notificationToast } from '@/utils/toast';
import SocketManager from '@/utils/socketManager';

export default function NotificationBell() {
  const router = useRouter();
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);
  const [activeTab, setActiveTab] = useState("all");
  const [isConnected, setIsConnected] = useState(false);
  const connectionAttempted = useRef(false);  // 新增：追蹤是否已嘗試連接

  // 確保客戶端渲染
  useEffect(() => {
    setMounted(true);
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Socket 連接管理
  useEffect(() => {
    if (!session?.user?.id || !mounted || connectionAttempted.current) return;
    
    connectionAttempted.current = true;  // 標記已嘗試連接
    
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

    socketRef.current = newSocket;
    setSocket(newSocket);

    // 連接事件處理
    newSocket.on('connect', () => {
      console.log('Socket 已連接 ✅ Transport:', newSocket.io.engine.transport.name);
      setIsConnected(true);
      newSocket.emit("getNotifications");
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket 連接錯誤:', error);
      setIsConnected(false);
    });

    // 通知列表處理
    const handleNotificationsList = (data) => {
      console.log("收到通知列表:", data);
      try {
        const { 
          notifications = [], 
          unreadCount = 0
        } = data;

        const processedNotifications = notifications.map((notification) => ({
          ...notification,
          is_read: !!notification.is_read,
          created_at: notification.created_at || new Date().toISOString(),
        }));

        setNotifications(processedNotifications);
        setUnreadCount(unreadCount);

      } catch (error) {
        console.error("處理通知列表時出錯:", error);
      }
    };

    // 新通知處理 - 只處理即時通知
    const handleNewNotification = (notification) => {
      console.log("收到新通知:", notification);
      if (!notification) return;

      setNotifications((prev) => [
        {
          ...notification,
          is_read: false,
          created_at: notification.created_at || new Date().toISOString(),
        },
        ...prev,
      ]);

      // 更新未讀數量
      if (notification.unreadCount !== undefined) {
        setUnreadCount(notification.unreadCount);
      } else {
        setUnreadCount((prev) => prev + 1);
      }

      // 顯示新通知提醒
      notificationToast.info(notification.title || '您有一則新通知');
    };

    // 通知已讀處理
    const handleNotificationRead = ({ notificationId }) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    };

    // 設置心跳檢測
    const heartbeat = setInterval(() => {
      if (newSocket?.connected) {
        console.log('發送心跳...');
        newSocket.emit('ping');
      } else {
        console.log('Socket 未連接，嘗試重新連接...');
        newSocket?.connect();
      }
    }, 25000); // 每 25 秒發送一次

    // 監聽心跳回應
    newSocket.on('pong', () => {
      console.log('收到服務器心跳回應');
    });

    // 設置事件監聽器
    newSocket.on("notificationsList", handleNotificationsList);
    newSocket.on("newNotification", handleNewNotification);
    newSocket.on("notificationRead", handleNotificationRead);

    // 確保刪除事件監聽器正確設置
    console.log("設置刪除事件監聽器");
    newSocket.on("notificationsDeleted", handleNotificationsDeleted);

    // 清理函數
    return () => {
      console.log("清理 Socket 事件監聽器");
      clearInterval(heartbeat); // 清理心跳檢測
      if (newSocket) {
        newSocket.off('ping');
        newSocket.off('pong');
        newSocket.off("connect");
        newSocket.off("connect_error");
        newSocket.off("notificationsList");
        newSocket.off("newNotification");
        newSocket.off("notificationRead");
        newSocket.off("notificationsDeleted");
      }
      // 重置連接嘗試標記
      connectionAttempted.current = false;
    };
  }, [session?.user?.id, mounted]);  // 只在 user.id 變化時重新連接

  // 組件卸載時清理
  useEffect(() => {
    return () => {
      console.log("組件卸載，清理 Socket");
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      // 重置連接嘗試標記
      connectionAttempted.current = false;
    };
  }, []);

  // 添加連接狀態顯示
  useEffect(() => {
    if (!isConnected) {
      console.log("Socket 未連接，等待連接...");
    }
  }, [isConnected]);

  // 監控未讀數量變化
  useEffect(() => {
    console.log("未讀數量更新:", unreadCount);
  }, [unreadCount]);

  // 監控通知列表變化
  useEffect(() => {
    console.log("通知列表更新:", notifications);
  }, [notifications]);

  // 修改：處理點擊鈴鐺
  const handleBellClick = async () => {
    if (!session?.user) {
      const result = await showConfirm("請先登入", "登入後即可查看通知內容");

      if (result.isConfirmed) {
        router.push("/auth/login");
      }
      return;
    }

    setShowDropdown(!showDropdown);
  };

  // 修改：處理標籤切換
  const handleTabChange = (newTab) => {
    setActiveTab(newTab);

    // 只有在有 socket 連接且不是 'all' 標籤時才自動標記已讀
    if (socket && socket.connected && newTab !== "all") {
      try {
        // 找出該類型的未讀通知
        const unreadNotifications = notifications.filter(
          (n) => n.type === newTab && !n.is_read
        );

        // 如果有未讀通知，則標記為已讀
        if (unreadNotifications.length > 0) {
          // 發送標記已讀請求
          socket.emit("markTypeAsRead", { type: newTab });

          // 更新本地狀態
          setNotifications((prev) =>
            prev.map((n) => (n.type === newTab ? { ...n, is_read: true } : n))
          );

          // 更新未讀數量
          const newUnreadCount = notifications.filter(
            (n) => !n.is_read && n.type !== newTab
          ).length;
          setUnreadCount(newUnreadCount);
        }
      } catch (error) {
        console.error("標記已讀失敗:", error);
        showError("操作失敗", error.message || "標記已讀時發生錯誤");
      }
    }
  };

  // 格式化時間
  const formatDate = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 新增：根據類型過濾通知並計算未讀數量
  const getUnreadCountByType = (type) => {
    return notifications.filter(
      (notification) => notification.type === type && !notification.is_read
    ).length;
  };

  // 新增：根據類型過濾通知
  const filteredNotifications = notifications.filter((notification) => {
    if (activeTab === "all") return true;
    return notification.type === activeTab;
  });

  // 獲取通知類型樣式
  const getTypeStyles = (type) => {
    switch (type) {
      case "system":
        return {
          label: "系統",
          icon: <BellIconSolid className="h-5 w-5" />,
          bgColor: "bg-indigo-50",
          textColor: "text-indigo-600",
          borderColor: "border-indigo-500",
          hoverBg: "hover:bg-indigo-50/70",
          iconColor: "text-indigo-500",
          ringColor: "ring-indigo-200",
        };
      case "message":
        return {
          label: "訊息",
          icon: <EnvelopeIcon className="h-5 w-5" />,
          bgColor: "bg-emerald-50",
          textColor: "text-emerald-600",
          borderColor: "border-emerald-500",
          hoverBg: "hover:bg-emerald-50/70",
          iconColor: "text-emerald-500",
          ringColor: "ring-emerald-200",
        };
      case "alert":
        return {
          label: "提醒",
          icon: <ExclamationTriangleIcon className="h-5 w-5" />,
          bgColor: "bg-amber-50",
          textColor: "text-amber-600",
          borderColor: "border-amber-500",
          hoverBg: "hover:bg-amber-50/70",
          iconColor: "text-amber-500",
          ringColor: "ring-amber-200",
        };
      default:
        return {
          label: "其他",
          icon: <BellIconSolid className="h-5 w-5" />,
          bgColor: "bg-slate-50",
          textColor: "text-slate-600",
          borderColor: "border-slate-300",
          hoverBg: "hover:bg-slate-50/70",
          iconColor: "text-slate-500",
          ringColor: "ring-slate-200",
        };
    }
  };

  // 處理標記已讀
  const handleNotificationClick = async (notification) => {
    if (!notification.is_read && socket) {
      try {
        // 發送更新請求到服務器
        socket.emit("markAsRead", {
          notificationId: notification.id,
        });

        // 立即更新本地狀態
        setUnreadCount((prev) => Math.max(0, prev - 1));
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, is_read: true } : n
          )
        );
      } catch (error) {
        console.error("標記已讀失敗:", error);
        // 錯誤處理...
      }
    }
  };

  // 修改：處理標記全部已讀
  const handleMarkAllAsRead = () => {
    if (!socket?.connected) {
      showError("操作失敗", "Socket 連接已斷開，請重新整理頁面");
      return;
    }

    try {
      // 檢查 socket 是否存在且已連接
      console.log("開始標記已讀，Socket 狀態:", {
        id: socket.id,
        connected: socket.connected,
        transport: socket.io.engine.transport.name
      });

      socket.emit("markAllAsRead", {
        type: activeTab !== "all" ? activeTab : undefined,
      });

      // 更新本地狀態
      setNotifications((prev) =>
        prev.map((n) => {
          if (activeTab === "all" || n.type === activeTab) {
            return { ...n, is_read: true };
          }
          return n;
        })
      );

      // 重新計算未讀數量
      setUnreadCount((prev) => {
        if (activeTab === "all") return 0;
        return notifications.filter((n) => !n.is_read && n.type !== activeTab).length;
      });

      // 顯示成功提示
      Swal.fire({
        icon: "success",
        title: "標記已讀",
        text: `已將${activeTab === "all" ? "所有" : getTypeStyles(activeTab).label}通知標記為已讀`,
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("標記已讀失敗:", error);
      showError("操作失敗", error.message || "標記已讀時發生錯誤");
    }
  };

  // 修改刪除處理函數
  const handleDeleteNotifications = async () => {
    if (!socket?.connected) {
      showError("操作失敗", "Socket 連接已斷開，請重新整理頁面");
      return;
    }

    try {
      console.log("開始刪除通知，Socket 狀態:", {
        id: socket.id,
        connected: socket.connected,
        transport: socket.io.engine.transport.name
      });

      const result = await showNotificationAlert.confirmDelete(
        activeTab === 'all' ? 'all' : getTypeStyles(activeTab).label
      );

      if (result.isConfirmed) {
        socket.emit('deleteNotifications', {
          type: activeTab !== 'all' ? activeTab : undefined
        });

        // 顯示載入中提示
        Swal.fire({
          title: '處理中...',
          text: '正在刪除通知',
          allowOutsideClick: false,
          showConfirmButton: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });
      }
    } catch (error) {
      console.error('刪除通知失敗:', error);
      Swal.close();
      showError("刪除失敗", error.message || "刪除通知時發生錯誤，請稍後再試");
    }
  };

  // 修改刪除成功處理函數
  const handleNotificationsDeleted = () => {
    console.log("收到刪除成功事件");
    // 關閉載入中提示
    Swal.close();
    // 顯示成功提示
    Swal.fire({
      icon: "success",
      title: "刪除成功",
      text: `已刪除${
        activeTab === "all" ? "所有" : getTypeStyles(activeTab).label
      }通知`,
      timer: 1500,
      showConfirmButton: false,
      position: "top-end", // 右上角顯示
      toast: true, // 使用 toast 樣式
      timerProgressBar: true, // 顯示倒計時進度條
    });
  };

  // 在客戶端渲染前返回 null 或加載狀態
  if (!mounted) {
    return (
      <div className="relative">
        <button className="relative focus:outline-none">
          <BellIcon className="h-6 w-6 text-gray-600" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* 鈴鐺按鈕 */}
      <button
        onClick={handleBellClick}
        className="relative p-2 text-gray-600 hover:text-gray-800 focus:outline-none"
      >
        {unreadCount > 0 ? (
          <BellIconSolid className="h-6 w-6" />
        ) : (
          <BellIcon className="h-6 w-6" />
        )}

        {/* 未讀數量標記 */}
        {unreadCount > 0 && (
          <span
            key={unreadCount}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* 通知下拉面板 */}
      {showDropdown && session?.user && (
        <div className="absolute right-0 mt-3 w-[720px] bg-white rounded-2xl shadow-2xl py-2 z-50 border border-gray-100 transform transition-all duration-300 ease-out animate-slideIn">
          <div className="flex flex-col h-[600px]">
            {" "}
            {/* 固定總高度 */}
            {/* 標題列 */}
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <BellIconSolid className="h-5 w-5 text-indigo-500" />
                通知中心
              </h3>
              <button
                onClick={() => setShowDropdown(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all duration-200 hover:rotate-90"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            {/* 分類標籤 - 改為水平排列 */}
            <div className="grid grid-cols-4 gap-4 px-5 py-3 border-b border-gray-100">
              {["all", "system", "message", "alert"].map((tab) => {
                const isActive = activeTab === tab;
                const styles =
                  tab === "all"
                    ? { label: "全部", textColor: "text-gray-600" }
                    : getTypeStyles(tab);

                const unreadCount =
                  tab === "all"
                    ? notifications.filter((n) => !n.is_read).length
                    : getUnreadCountByType(tab);

                return (
                  <button
                    key={tab}
                    onClick={() => handleTabChange(tab)}
                    className={`py-3 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2
                      ${
                        isActive
                          ? `${styles.textColor} ${styles.bgColor} ring-2 ${styles.ringColor} scale-105 shadow-sm`
                          : "text-gray-500 hover:bg-gray-50 hover:scale-105"
                      }
                      flex-1 min-w-[120px]`}
                  >
                    {tab !== "all" && (
                      <div className={styles.iconColor}>{styles.icon}</div>
                    )}
                    {styles.label}
                    {unreadCount > 0 && (
                      <span
                        className={`text-xs ${styles.textColor} bg-white/50 px-2 py-0.5 rounded-full`}
                      >
                        {unreadCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {/* 通知列表 - 使用 flex-1 自動佔據剩餘空間 */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
              <div className="grid grid-cols-2 gap-4 p-4">
                {" "}
                {/* 改為兩列佈局 */}
                {filteredNotifications.length > 0 ? (
                  filteredNotifications.map((notification) => {
                    const styles = getTypeStyles(notification.type);
                    return (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`group p-4 rounded-xl cursor-pointer transition-all duration-200 
                          ${!notification.is_read ? styles.bgColor : "hover:bg-gray-50"}
                          border-l-4 ${styles.borderColor}
                          hover:scale-[0.99] active:scale-[0.98]
                          shadow-sm hover:shadow-md
                          max-w-full`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`mt-1 ${styles.iconColor} transform group-hover:rotate-12 transition-transform duration-200 flex-shrink-0`}
                          >
                            {styles.icon}
                          </div>
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <div className="flex justify-between items-start gap-2 mb-2">
                              <span
                                className={`text-xs font-medium px-2.5 py-1 rounded-lg ${styles.bgColor} ${styles.textColor} flex-shrink-0`}
                              >
                                {styles.label}
                              </span>
                              <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                                {formatDate(notification.created_at)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-800 mt-1.5 leading-relaxed 
                              line-clamp-2 group-hover:line-clamp-none 
                              transition-all duration-200
                              break-words whitespace-pre-wrap">
                              {notification.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-2 px-5 py-10 text-center">
                    <BellIcon className="h-16 w-16 text-gray-300 mx-auto mb-4 animate-pulse" />
                    <p className="text-gray-500">
                      暫無
                      {activeTab === "all"
                        ? ""
                        : getTypeStyles(activeTab).label
                      }
                      通知
                    </p>
                  </div>
                )}
              </div>
            </div>
            {/* 底部操作區 */}
            {notifications.length > 0 && (
              <div className="px-5 py-3 border-t border-gray-100 flex justify-between items-center bg-white">
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  <CheckCircleIcon className="h-4 w-4" />
                  標記全部已讀
                </button>
                <button
                  onClick={handleDeleteNotifications}
                  className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                >
                  <TrashIcon className="h-4 w-4" />
                  刪除通知
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
