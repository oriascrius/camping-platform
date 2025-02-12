"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { showCartAlert } from "@/utils/sweetalert"; // 老大做好的 SweetAlert

// 1️⃣ 建立全域購物車 Context
const ProductCartContext = createContext(null);

// 2️⃣ Context Provider
export function ProductCartProvider({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const hasAlerted = useRef(false); // ✅ 用來追蹤 alert 是否已執行

  // 3️⃣ 讀取購物車內容（未登入則彈出警告）
  const fetchCart = useCallback(async () => {
    try {
      const res = await fetch("/api/product-cart", {
        method: "GET",
        credentials: "include",
      });

      if (res.status === 401) {
        if (!hasAlerted.current) {
          hasAlerted.current = true;
          showCartAlert.confirm("請先登入才能查看購物車內容").then((result) => {
            if (result.isConfirmed) {
              router.push("/auth/login"); // ✅ 按「確認」跳轉
            }
          });
        }
        return;
      }

      if (!res.ok) throw new Error("無法獲取購物車");

      const data = await res.json();
      setCart(data);
    } catch (error) {
      console.error("購物車讀取失敗:", error);
    }
  }, [router]);

  // 4️⃣ 加入商品到購物車（未登入則彈出警告）
  const addToCart = useCallback(
    async (productId, quantity = 1) => {
      try {
        hasAlerted.current = false;
        const res = await fetch("/api/product-cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, quantity }),
        });

        if (res.status === 401) {
          if (!hasAlerted.current) {
            hasAlerted.current = true;
            showCartAlert.confirm("請先登入才能加入購物車").then((result) => {
              if (result.isConfirmed) {
                router.push("/auth/login"); // ✅ 按「確認」跳轉
              }
            });
          }
          return false; // ✅ 直接回傳 false，避免後續執行
        }

        if (!res.ok) throw new Error("加入購物車失敗");

        fetchCart(); // ✅ 更新購物車內容
        return true; // ✅ 加入成功，回傳 true
      } catch (error) {
        console.error("加入購物車錯誤:", error);
        return false;
      }
    },
    [fetchCart, router]
  );

  // 5️⃣ 只在「購物車頁面」執行 `fetchCart()`
  useEffect(() => {
    hasAlerted.current = false; // ✅ 每次頁面切換時重置 `alert` 狀態
    if (pathname === "/cart" || isCartOpen || pathname === "/fill-cart") {
      fetchCart();
    }
  }, [fetchCart, pathname]);

  return (
    <ProductCartContext.Provider
      value={{ cart, addToCart, fetchCart, isCartOpen, setIsCartOpen }}
    >
      {children}
    </ProductCartContext.Provider>
  );
}

// 6️⃣ 建立 `useProductCart` 鉤子
export function useProductCart() {
  const context = useContext(ProductCartContext);
  if (!context) {
    throw new Error("useProductCart 必須在 ProductCartProvider 內使用");
  }
  return context;
}
