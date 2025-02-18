"use client";
import { ToastContainer, toast as toastify } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FaCheck,
  FaTimes,
  FaExclamationTriangle,
  FaInfo,
  FaSpinner,
} from "react-icons/fa";

// 自定義 Icon 組件 - 添加顏色參數
const CustomIcon = ({ icon: Icon, color }) => (
  <Icon className={`text-xl ${color}`} />
);

// 添加自定義樣式 - 移除 icon 顏色的強制覆蓋
const customStyles = `
  .Toastify__progress-bar-theme--light {
    background: var(--primary-color) !important;
  }
  
  .Toastify__progress-bar--success {
    background: var(--primary-color) !important;
  }
  
  .Toastify__progress-bar--error {
    background: var(--status-error) !important;
  }
  
  .Toastify__progress-bar--warning {
    background: var(--status-warning) !important;
  }
  
  .Toastify__progress-bar--info {
    background: var(--primary-color) !important;
  }

  .Toastify__spinner {
    border-color: var(--gray-4) !important;
  }
`;

// Toast Container 元件
export const ToastContainerComponent = () => (
  <>
    <style>{customStyles}</style>
    <ToastContainer
      // === 基本設定 ===
      position="top-right"
      autoClose={2000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="light"
      // === 樣式設定 ===
      style={{
        fontSize: "var(--font-size-sm)",
        fontWeight: "var(--fw-medium)",
        minWidth: "300px",
        maxWidth: "500px",
        top: "100px",
      }}
    />
  </>
);

// 基本設定
const defaultOptions = {
  position: "top-right",
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  theme: "light",
  newestOnTop: false,
};

// 統一的吐司服務
export const toast = {
  // 成功提示 (綠色)
  success: (message) => {
    toastify(message, {
      ...defaultOptions,
      type: "success",
      icon: <CustomIcon icon={FaCheck} color="text-[var(--primary-color)]" />,
      autoClose: 1500,
      className: "border-l-4 border-[var(--primary-color)]",
      style: {
        background: "#F5F8F5",
        color: "var(--primary-color)",
      },
    });
  },

  // 錯誤提示
  error: (message) => {
    toastify(message, {
      ...defaultOptions,
      type: "error",
      icon: <CustomIcon icon={FaTimes} color="text-[var(--status-error)]" />,
      autoClose: 3000,
      className: "border-l-4 border-[var(--status-error)]",
      style: {
        background: "#FDF8F8",
        color: "var(--status-error)",
      },
    });
  },

  // 警告提示
  warning: (message) => {
    toastify(message, {
      ...defaultOptions,
      type: "warning",
      icon: (
        <CustomIcon
          icon={FaExclamationTriangle}
          color="text-[var(--status-warning)]"
        />
      ),
      autoClose: 3000,
      className: "border-l-4 border-[var(--status-warning)]",
      style: {
        background: "#FDF9F3",
        color: "var(--status-warning)",
      },
    });
  },

  // 一般信息
  info: (message) => {
    toastify(message, {
      ...defaultOptions,
      type: "info",
      icon: <CustomIcon icon={FaInfo} color="text-[var(--primary-color)]" />,
      autoClose: 2000,
      className: "border-l-4 border-[var(--primary-color)]",
      style: {
        background: "#F5F8F5",
        color: "var(--primary-color)",
      },
    });
  },

  // 載入中提示
  loading: (message = "載入中...") => {
    return toastify.loading(message, {
      ...defaultOptions,
      icon: <FaSpinner className="animate-spin text-xl text-[var(--gray-4)]" />,
      autoClose: false,
      className: "border-l-4 border-[var(--gray-4)]",
      style: {
        background: "var(--gray-7)",
        color: "var(--gray-4)",
      },
    });
  },

  // 更新已存在的 toast
  update: (toastId, message, type = "success") => {
    toastify.update(toastId, {
      render: message,
      type: type,
      autoClose: 1500,
      isLoading: false,
    });
  },
};

// 購物車相關吐司，畫面上 cartToast.以下方法呼叫
export const cartToast = {
  addSuccess: () => toast.success("已加入購物車"),
  removeSuccess: () => toast.success("已移除商品"),
  updateSuccess: () => toast.success("購物車已更新"),
  error: (message) => toast.error(message || "操作失敗，請稍後再試"),
  loading: () => toast.loading("處理中..."),
};

// 收藏相關吐司
export const favoriteToast = {
  addSuccess: () => toast.success("已加入收藏"),
  removeSuccess: () => toast.success("已取消收藏"),
  error: (message) => toast.error(message || "操作失敗，請稍後再試"),
};

// 表單相關吐司
export const formToast = {
  submitSuccess: () => toast.success("提交成功"),
  submitError: (message) => toast.error(message || "提交失敗"),
  saving: () => toast.loading("儲存中..."),
  validateError: () => toast.error("請檢查輸入內容"),
};

// ===== 活動搜尋相關提示 =====
export const searchToast = {
  // 成功提示（用於顯示搜尋成功訊息）
  success: (message = "搜尋完成") => {
    toast.success(message, {
      position: "top-right",
      autoClose: 3000,
    });
  },

  // 警告提示（用於顯示非嚴重的警告訊息）
  warning: (message) => {
    toast.warning(message, {
      position: "top-right",
      autoClose: 3000,
    });
  },

  // 錯誤提示（用於顯示非嚴重的錯誤訊息）
  error: (message) => {
    toast.error(message, {
      position: "top-right",
      autoClose: 3000,
    });
  },

  // 提示訊息（用於顯示一般資訊）
  info: (message) => {
    toast.info(message, {
      position: "top-right",
      autoClose: 3000,
    });
  },
};

// ===== 討論區相關提示 =====
export const discussionToast = {
  // 成功提示（用於顯示操作成功訊息）
  success: (message) => {
    toast.success(message, {
      position: "top-right",
      autoClose: 3000,
    });
  },

  // 錯誤提示（用於顯示一般錯誤訊息）
  error: (message) => {
    toast.error(message, {
      position: "top-right",
      autoClose: 3000,
    });
  },
};

// ===== 設定相關提示 =====
export const settingsToast = {
  // 成功提示（用於顯示操作成功訊息）
  success: (message) => {
    toast.success(message, {
      position: "top-right",
      autoClose: 3000,
    });
  },

  // 一般錯誤提示（用於顯示非重要錯誤）
  error: (message) => {
    toast.error(message, {
      position: "top-right",
      autoClose: 3000,
    });
  },

  // 警告提示（用於顯示警告訊息）
  warning: (message) => {
    toast.warning(message, {
      position: "top-right",
      autoClose: 3000,
    });
  },
};

// ===== 預訂相關提示 =====
export const bookingToast = {
  // 成功提示（用於顯示操作成功訊息）
  success: (message) => {
    toast.success(message, {
      position: "top-right",
      autoClose: 3000,
    });
  },

  // 錯誤提示（用於顯示一般錯誤訊息）
  error: (message) => {
    toast.error(message, {
      position: "top-right",
      autoClose: 3000,
    });
  },
};

// 結帳相關提示
export const checkoutToast = {
  success: (message = "操作成功") => {
    toast.success(message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  },
  error: (message = "操作失敗") => {
    toast.error(message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  },
  warning: (message) => {
    toast.warning(message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  },
  info: (message) => {
    toast.info(message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  },
};

// ===== 通知相關提示 =====
export const notificationToast = {
  // 刪除成功提示
  deleteSuccess: (type = "all") => {
    toast.success(`已刪除${type === "all" ? "所有" : type}通知`, {
      position: "top-right",
      autoClose: 1500,
    });
  },

  // 錯誤提示
  error: (message) => {
    toast.error(message || "操作失敗，請稍後再試", {
      position: "top-right",
      autoClose: 3000,
    });
  },

  // 連線狀態提示
  connectionError: () => {
    toast.error("連線已斷開，請重新整理頁面", {
      position: "top-right",
      autoClose: 3000,
    });
  },

  // 發送成功提示
  sendSuccess: () => {
    toast.success("通知發送成功", {
      position: "top-right",
      autoClose: 1500,
    });
  },

  //  登入歡迎提示
  info: (message) => {
    toast.info(message, {
      position: "top-right",
      autoClose: 2000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  },
};
