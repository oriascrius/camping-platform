"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaTimes } from "react-icons/fa";
import { showCartAlert } from "@/utils/sweetalert"; // SweetAlert 工具
import styles from "@/styles/pages/product-cart/ProductCartSidebar/ProductCartSidebar.module.css"; // CSS 模組
import Link from "next/link";

export function ProductCartSidebar({ isOpen, setIsOpen }) {
  const router = useRouter();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCartItems();
    }
  }, [isOpen]);

  const fetchCartItems = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/product-cart");

      if (response.status === 401) {
        setIsLoggedIn(false);
        await showCartAlert.confirm("請先登入", "登入後即可查看購物車內容");
        setIsOpen(false);
        router.push("/auth/login");
        return;
      }

      if (!response.ok) {
        throw new Error("獲取購物車失敗");
      }

      const data = await response.json();
      setCartItems(data.cartItems || []);
      setIsLoggedIn(true);
    } catch (error) {
      console.error("購物車載入錯誤:", error);
    } finally {
      setLoading(false);
    }
  };

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
          <h5 className="offcanvas-title">購物車</h5>
          <button
            type="button"
            className="btn-close"
            onClick={() => setIsOpen(false)}
          ></button>
        </div>

        <div className="offcanvas-body">
          {loading ? (
            <p className="text-center">載入中...</p>
          ) : cartItems.length === 0 ? (
            <div className="text-center">
              <p className="text-muted">購物車內沒有商品</p>
              <Link
                href="/products"
                className="btn btn-primary mt-3"
                onClick={() => setIsOpen(false)}
              >
                去逛逛
              </Link>
            </div>
          ) : (
            <ul className="list-group">
              {cartItems.map((item) => (
                <li
                  key={item.product_id}
                  className="list-group-item d-flex align-items-center"
                >
                  <img
                    src={`/images/products/${item.product_image}`}
                    alt={item.product_name}
                    className={`me-3 ${styles.productImage}`}
                  />
                  <div className="flex-grow-1">
                    <p className="mb-1">{item.product_name}</p>
                    <small className="text-muted">數量: {item.quantity}</small>
                  </div>
                  <span className="fw-bold">
                    NT$ {item.product_price * item.quantity}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 底部按鈕 */}
        <div className="offcanvas-footer p-3 border-top text-center">
          <button
            className="btn btn-dark w-100"
            onClick={() => {
              if (!isLoggedIn) {
                showCartAlert.confirm("請先登入", "登入後即可查看購物車內容");
                router.push("/auth/login");
                return;
              }
              router.push("/product-cart/cart");
              setIsOpen(false);
            }}
          >
            查看購物車
          </button>
        </div>
      </div>
    </>
  );
}
