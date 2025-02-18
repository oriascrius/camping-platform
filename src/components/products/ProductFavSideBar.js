"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/styles/pages/product-cart/ProductCartSidebar/ProductCartSidebar.module.css";
import Link from "next/link";

// API 請求工具 (查詢、刪除)
const fetchWishlist = async () => {
  try {
    const res = await fetch("/api/products/productFav");
    if (!res.ok) throw new Error("無法獲取收藏清單");
    const data = await res.json();
    return data.wishlist || [];
  } catch (error) {
    console.error("獲取收藏清單失敗:", error);
    return [];
  }
};

const removeFromWishlist = async (item_id, setFavorites) => {
  try {
    const res = await fetch("/api/products/productFav", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item_id }),
    });

    if (!res.ok) throw new Error("移除收藏失敗");
    setFavorites((prev) => prev.filter((item) => item.item_id !== item_id));
  } catch (error) {
    console.error("移除收藏錯誤:", error);
  }
};

export function ProductFavSidebar({ isOpen, setIsOpen }) {
  const router = useRouter();
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    if (isOpen) {
      fetchWishlist().then(setFavorites); // ✅ 開啟側邊欄時獲取收藏列表
    }
  }, [isOpen]);

  return (
    <>
      {/* 背景遮罩 */}
      <div
        className={`offcanvas-backdrop fade ${isOpen ? "show" : "d-none"}`}
        onClick={() => setIsOpen(false)}
      ></div>

      {/* 側邊欄 */}
      <div
        className={`offcanvas offcanvas-end ${isOpen ? "show" : ""} ${
          styles.sidebar
        }`}
        tabIndex="-1"
      >
        <div className="offcanvas-header border-bottom">
          <h4 className={`offcanvas-title ${styles.pCartSidebarTitle}`}>
            我的商品收藏 ({favorites.length})
          </h4>
          <button
            type="button"
            className="btn-close"
            onClick={() => setIsOpen(false)}
          ></button>
        </div>

        <div className="offcanvas-body">
          {favorites.length === 0 ? (
            <div className="text-center">
              <p className="text-muted mb-5">您的收藏清單是空的</p>
              <Link
                href="/products"
                className={`${styles.sidebarCartButton} mt-5`}
                onClick={() => setIsOpen(false)}
              >
                去逛逛
              </Link>
            </div>
          ) : (
            <ul className="list-group">
              {favorites.map((item) => (
                <li
                  key={item.id}
                  className="list-group-item d-flex align-items-center"
                >
                  {/* 點擊導向商品詳情頁 */}
                  <Link
                    href={`/products/${item.item_id}`}
                    onClick={() => setIsOpen(false)}
                    className={`${styles.productSidebarLink} flex-grow-1`}
                  >
                    <div className={`${styles.productSidebarItem} mt-3`}>
                      {/* 商品主圖片 */}
                      <img
                        src={`/images/products/${item.product_image}`}
                        alt={item.product_name}
                        className={`${styles.productSidebarImage} `}
                      />
                      <div>
                        <p className="m-0 fw-bold">{item.product_name}</p>
                        <p className="m-0 text-muted">
                          NT$ {item.product_price}
                        </p>
                      </div>
                    </div>
                  </Link>

                  {/* 刪除收藏按鈕
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() =>
                      removeFromWishlist(item.item_id, setFavorites)
                    }
                  >
                    x
                  </button> */}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 底部按鈕 */}
        <div className="offcanvas-footer p-3 border-top text-center">
          <button
            className={`${styles.sidebarCartButton} w-100`}
            onClick={() => {
              router.push("/member/wishlist");
              setIsOpen(false);
            }}
          >
            查看收藏清單列表
          </button>
        </div>
      </div>
    </>
  );
}
