'use client';
// ===== 核心套件引入 =====
import { useState, useEffect } from 'react';
import { FaShoppingCart } from 'react-icons/fa';
import { useSession } from 'next-auth/react';
import { showLoginAlert } from "@/utils/sweetalert";  // 引入 sweetalert

// ===== 購物車圖標元件 =====
// 功能：顯示購物車圖標和商品數量，處理未登入狀態的路徑儲存
// 參數：onClick - 點擊事件處理函數
export function CartIcon({ onClick }) {
  // ===== 狀態管理 =====
  const { data: session, status } = useSession();  // 用戶登入狀態
  const [itemCount, setItemCount] = useState(0);   // 購物車商品數量
  const [isAnimating, setIsAnimating] = useState(false);  // 動畫狀態

  // ===== 獲取購物車數量 =====
  const fetchCartCount = async () => {
    try {
      // 等待登入狀態載入完成
      if (status === 'loading') return;
      
      // 處理未登入狀態
      if (!session) {
        // 步驟1: 獲取當前完整路徑（包含查詢參數）
        const currentPath = window.location.pathname + window.location.search;
        // 步驟2: 儲存路徑到 localStorage，用於登入後重導向
        localStorage.setItem('redirectAfterLogin', currentPath);
        // 步驟3: 清空購物車數量顯示
        setItemCount(0);
        return;
      }

      // 已登入狀態：獲取購物車數據
      const response = await fetch('/api/camping/cart');
      
      // 處理請求錯誤
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '獲取購物車失敗');
      }
      
      // 更新購物車數量
      const data = await response.json();
      setItemCount(data.cartItems?.length || 0);
    } catch (error) {
      await showLoginAlert.error('獲取購物車數量失敗');
      setItemCount(0);
    }
  };

  // ===== 效果處理 =====
  useEffect(() => {
    // 步驟1: 初始載入購物車數量
    if (status !== 'loading') {
      fetchCartCount();
    }

    // 步驟2: 處理購物車更新事件
    const handleCartUpdate = () => {
      fetchCartCount();  // 重新獲取購物車數量
      // 觸發動畫效果
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 300);
    };

    // 步驟3: 註冊購物車更新事件監聽
    window.addEventListener('cartUpdate', handleCartUpdate);
    
    // 步驟4: 清理事件監聽
    return () => window.removeEventListener('cartUpdate', handleCartUpdate);
  }, [session, status]);  // 依賴於登入狀態變化

  // ===== 渲染購物車圖標 =====
  return (
    <div className="relative">
      {/* 購物車基本圖標 */}
      <FaShoppingCart className="w-6 h-6 text-gray-600" />
      
      {/* 購物車數量標記 */}
      {itemCount > 0 && (
        <span 
          className={`absolute -top-3 -right-3 bg-red-500 text-white text-xs 
            rounded-full w-5 h-5 flex items-center justify-center
            ${isAnimating ? 'animate-bounce-once' : ''}`}
        >
          {itemCount}
        </span>
      )}
    </div>
  );
} 