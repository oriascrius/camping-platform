'use client';  // 標記為客戶端元件

import { ToastContainer, toast as originalToast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// 自定義吐司設定
export const toast = {
  success: (message) => {
    originalToast.success(message, {
      autoClose: 500,  // 0.5秒後自動關閉
    });
  },
  error: (message) => {
    originalToast.error(message, {
      autoClose: 2000,  // 錯誤訊息多顯示一秒
    });
  },
  warning: (message) => {
    originalToast.warning(message, {
      autoClose: 2000,  // 警告訊息顯示2秒
    });
  },
  info: (message) => {
    originalToast.info(message, {
      autoClose: 2000,
    });
  },
};

// 通知提示元件
// 用途：提供全站統一的通知提示樣式
// 1. 設定通知的顯示位置、動畫效果
// 2. 定義通知的樣式（寬度、顏色、邊框等）
// 3. 管理不同類型通知的視覺差異（成功、警告、錯誤）
export default function ToastProvider() {
  return (
    <ToastContainer
      // === 基本設定 ===
      position="top-center"        // 通知顯示位置：頂部中間
      hideProgressBar={false}     // 顯示進度條
      newestOnTop                 // 最新的通知顯示在頂部
      closeOnClick               // 點擊後關閉通知
      rtl={false}                // 不使用從右到左的排列
      pauseOnFocusLoss          // 失去焦點時暫停倒數
      draggable                 // 可拖曳通知
      pauseOnHover              // 滑鼠懸停時暫停倒數
      theme="light"             // 使用亮色主題

      // === 容器樣式 ===
      style={{
        fontSize: '1rem',       // 字體大小
        fontWeight: '500',      // 字體粗細
        width: 'auto',         // 自動寬度
        minWidth: '400px',     // 最小寬度
        maxWidth: '600px',     // 最大寬度
      }}

      // === 通知樣式 ===
      toastStyle={{
        background: 'white',    // 背景色
        color: 'var(--gray-1)', // 文字顏色
        borderRadius: '0.5rem', // 圓角
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)', // 陰影
        padding: '1rem 1.5rem',  // 內邊距
        margin: '0.5rem 0',     // 外邊距
      }}

      // === 狀態樣式 ===
      // 根據通知類型設定不同的邊框顏色
      toastClassName={({ type }) => {
        switch (type) {
          case 'success':
            return 'border-l-4 border-[var(--status-success)]';
          case 'warning':
            return 'border-l-4 border-[var(--status-warning)]';
          case 'error':
            return 'border-l-4 border-[var(--status-error)]';
          default:
            return 'border-l-4 border-[var(--gray-4)]';
        }
      }}
    />
  );
} 