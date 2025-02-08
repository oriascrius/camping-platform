"use client"; // 確保這是一個 Client Component，因為 useState、useEffect 不能在 Server Component 使用

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

// 1️⃣ 建立全域購物車 Context
const ProductCartContext = createContext(null); // 初始值為 null，稍後在 Provider 設定內容

// 2️⃣ 建立 Context Provider，讓整個應用可以存取購物車功能
export function ProductCartProvider({ children }) {
  // 🔹 購物車內容
  const [cart, setCart] = useState([]); // 存放購物車商品列表
  // 🔹 控制側邊購物車開關
  const [isCartOpen, setIsCartOpen] = useState(false); // `true` 表示開啟購物車，`false` 表示關閉

  // 3️⃣ 讀取購物車內容（從後端 API 取得當前使用者的購物車）
  const fetchCart = useCallback(async () => {
    try {
      const res = await fetch("/api/product-cart", {
        method: "GET",
        credentials: "include",
      }); // 發送 API 請求
      if (!res.ok) throw new Error("無法獲取購物車");

      const data = await res.json(); // 解析 JSON 資料
      setCart(data); // 更新購物車內容
    } catch (error) {
      console.error("購物車讀取失敗:", error);
    }
  }, []); // `useCallback` 確保函式不會在每次渲染時重新建立

  // 4️⃣ 加入商品到購物車
  const addToCart = useCallback(
    async (productId, quantity = 1) => {
      try {
        const res = await fetch("/api/product-cart", {
          method: "POST", // 發送 POST 請求
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, quantity }), // 傳遞商品 ID 和數量
        });

        if (!res.ok) throw new Error("加入購物車失敗");

        fetchCart(); // ✅ 更新購物車內容，確保畫面顯示最新狀態
      } catch (error) {
        console.error("加入購物車錯誤:", error);
      }
    },
    [fetchCart] // `useCallback` 依賴 `fetchCart`，確保函式不會在每次渲染時重新建立
  );

  // 5️⃣ 當元件載入時，自動載入購物車內容
  useEffect(() => {
    fetchCart(); // 取得當前購物車內容
  }, [fetchCart]); // `useEffect` 依賴 `fetchCart`，確保購物車內容在初次渲染時正確載入

  return (
    <ProductCartContext.Provider
      value={{ cart, addToCart, fetchCart, isCartOpen, setIsCartOpen }}
    >
      {children}
    </ProductCartContext.Provider>
  );
}

// 6️⃣ 建立 `useProductCart` 鉤子，讓元件更方便存取購物車
export function useProductCart() {
  const context = useContext(ProductCartContext); // 取得購物車 Context
  if (!context) {
    throw new Error("useProductCart 必須在 ProductCartProvider 內使用"); // 若 Context 為 null，則拋出錯誤
  }
  return context; // 回傳購物車狀態與方法
}
