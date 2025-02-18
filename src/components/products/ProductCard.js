"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { favoriteToast } from "@/utils/toast"; // ✅ 確保 `toast` 被導入
import { showCartAlert } from "@/utils/sweetalert";
import { useRouter } from "next/navigation";

export default function ProductCard({ product }) {
  const [isFavorite, setIsFavorite] = useState(false); // ✅ 記錄是否收藏
  const hasAlerted = useRef(false); // ✅ 防止多次跳出提示
  const router = useRouter();

  // ✅ 使用 useCallback 來減少不必要的 `useEffect` 重新執行
  const checkFavoriteStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/products/productFav");

      // ✅ 401 時直接結束，避免 JSON 解析出錯
      if (res.status === 401) return;

      // ✅ 只有在 `res.ok === true` 時才解析 JSON，避免報錯
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);

      const data = await res.json();

      const exists = Array.isArray(data.wishlist)
        ? data.wishlist.some((item) => item.item_id === product.id)
        : false;
      setIsFavorite(exists);
    } catch (error) {
      // ✅ 只處理非 401 錯誤，避免過多錯誤訊息
      if (!error.message.includes("401")) {
        console.error("檢查收藏狀態失敗:", error);
      }
    }
  }, [product.id]);

  useEffect(() => {
    checkFavoriteStatus();
  }, [checkFavoriteStatus]);

  // ✅ 加入/移除願望清單
  const toggleFavorite = async () => {
    try {
      if (isFavorite) {
        // ✅ 移除收藏
        const res = await fetch("/api/products/productFav", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ item_id: product.id }),
        });

        if (!res.ok) throw new Error("無法移除收藏");

        setIsFavorite(false);
        console.log("🔴 取消收藏成功，執行 favoriteToast.removeSuccess()");
        favoriteToast.removeSuccess(); // ✅ 顯示移除成功吐司
      } else {
        // ✅ 加入收藏
        const res = await fetch("/api/products/productFav", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ item_id: product.id }),
        });
        if (res.status === 401) {
          if (!hasAlerted.current) {
            hasAlerted.current = true;
            showCartAlert.confirm("請先登入才能收藏商品").then((result) => {
              if (result.isConfirmed) router.push("/auth/login");
            });
          }
          hasAlerted.current = false;
          return;
        }

        if (!res.ok) throw new Error("無法加入收藏");

        setIsFavorite(true);
        console.log("❤️ 加入收藏成功，執行 favoriteToast.addSuccess()");
        favoriteToast.addSuccess(); // ✅ 顯示加入成功吐司
      }
    } catch (error) {
      console.error("❌ 更新收藏狀態錯誤:", error);
    }
  };

  return (
    <div className="col">
      <div className="card border-0">
        <img
          src={`/images/products/${product.main_image}`}
          className="card-img-top"
          alt={product.name}
        />
        <div className="card-body">
          <Link href={`/products/${product.id}`}>
            <h5 className="card-title mb-3">{product.name}</h5>
          </Link>
          <div className="d-flex justify-content-between">
            <p className="card-text">${product.price}</p>
            <button
              className="border-0 bg-transparent mt-2"
              onClick={toggleFavorite}
            >
              <i
                className={`fa-heart fa-lg ${
                  isFavorite ? "fa-solid text-danger" : "fa-regular"
                }`}
              ></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
