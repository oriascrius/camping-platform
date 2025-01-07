'use client';  // 標記為客戶端元件

import { ToastContainer } from "react-toastify";

// 通知提示元件
// 用途：提供全站的通知提示功能
export default function ToastProvider() {
  return (
    <ToastContainer
      position="top-center"        // 通知顯示位置：頂部中間
      autoClose={2000}            // 自動關閉時間：2秒
      hideProgressBar={false}     // 顯示進度條
      newestOnTop                 // 最新的通知顯示在頂部
      closeOnClick               // 點擊後關閉通知
      rtl={false}                // 不使用從右到左的排列
      pauseOnFocusLoss          // 失去焦點時暫停倒數
      draggable                 // 可拖曳通知
      pauseOnHover              // 滑鼠懸停時暫停倒數
      theme="colored"           // 使用彩色主題
    />
  );
} 