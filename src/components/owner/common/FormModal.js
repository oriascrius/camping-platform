"use client";
import { motion, AnimatePresence } from "framer-motion";
import { HiX } from "react-icons/hi";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Toast 共用配置
const toastConfig = {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  theme: "light",
};

// 成功提示樣式
const successStyle = {
  style: {
    background: '#E8F1ED',
    color: '#2C4A3B',
  },
  progressStyle: {
    background: '#6B8E7B'
  }
};

// 錯誤提示樣式
const errorStyle = {
  style: {
    background: '#F5E6E8',
    color: '#9B6B70'
  },
  progressStyle: {
    background: '#BA8E93'
  }
};

export default function FormModal({ 
  isOpen, 
  onClose, 
  title,
  children,
  onSubmit,
  submitButtonText = "確認",
  cancelButtonText = "取消",
  width = "520px",
  showFooter = true
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="bg-white rounded-xl shadow-xl flex flex-col"
            style={{ width: width, maxHeight: '90vh' }}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
          >
            {/* 標題區塊 */}
            <div className="sticky top-0 z-10 bg-white px-6 py-4 border-b border-[#A8C2B5]/20 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#2C4A3B]">
                {title}
              </h2>
              <button onClick={onClose}>
                <HiX className="w-5 h-5 text-[#2C4A3B]" />
              </button>
            </div>

            {/* 內容區塊 */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                {children}
              </div>
            </div>

            {/* 按鈕區塊 */}
            {showFooter && (
              <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-[#A8C2B5]/20">
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2.5 rounded-lg text-[#2C4A3B] hover:bg-[#A8C2B5]/10
                             transition-colors duration-200 font-medium"
                  >
                    {cancelButtonText}
                  </button>
                  <button
                    onClick={onSubmit}
                    className="px-6 py-2.5 rounded-lg bg-[#6B8E7B] text-white
                             hover:bg-[#5A7A68] transition-colors duration-200
                             focus:ring-2 focus:ring-[#6B8E7B]/20 focus:ring-offset-2
                             font-medium"
                  >
                    {submitButtonText}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// 導出 Toast 工具函數
export const showSuccessToast = (message, icon = '🎉') => {
  toast.success(message, {
    ...toastConfig,
    ...successStyle,
    icon
  });
};

export const showErrorToast = (message, icon = '❌') => {
  toast.error(message, {
    ...toastConfig,
    ...errorStyle,
    icon
  });
}; 