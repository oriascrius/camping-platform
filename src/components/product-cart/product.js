"use client";

import { useEffect, useMemo } from "react";
import { useProductCart } from "@/hooks/useProductCart"; // ✅ 使用購物車鉤子
import CartHeader from "./cart-header";
import CartItem from "./cart-item";
import CartSummary from "./cart-summary";
import CouponSelector from "./coupon-selector";
import { showCartAlert } from "@/utils/sweetalert"; // 老大做好的 SweetAlert
import { ToastContainerComponent, cartToast } from "@/utils/toast";

export default function Product() {
  const { cart, fetchCart } = useProductCart(); // ✅ 取得購物車內容與 API 函數

  // ✅ 頁面載入時，讀取購物車
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // ✅ 更新數量
  const handleQuantityChange = async (cartItemId, change) => {
    console.log(
      `送出 API 請求修改數量: cartItemId=${cartItemId}, 變更=${change}`
    );
    cartToast.updateSuccess();
    try {
      const res = await fetch(`/api/product-cart/${cartItemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ change }),
      });

      if (!res.ok) throw new Error("更新數量失敗");

      fetchCart(); // ✅ 重新取得最新購物車內容
    } catch (error) {
      console.error("數量變更錯誤:", error);
    }
  };

  // ✅ 刪除商品
  const handleDelete = async (cartItemId) => {
    try {
      const result = await showCartAlert.confirm(
        "確定要移除此商品？",
        "移除後將無法復原"
      );

      if (!result.isConfirmed) return;

      const res = await fetch(`/api/product-cart/${cartItemId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("刪除失敗");

      fetchCart(); // ✅ 重新取得最新購物車內容
    } catch (error) {
      console.error("刪除商品錯誤:", error);
    }
  };

  // ✅ 計算總價格（使用 useMemo 避免不必要的重新計算）
  const totalPrice = useMemo(() => {
    return cart.reduce(
      (sum, item) => sum + item.product_price * item.quantity,
      0
    );
  }, [cart]);

  return (
    <>
      <section className="cart-product">
        <div className="container">
          <div className="main">
            <CartHeader />
            <article className="content">
              <div className="header">
                <p>商品資料</p>
                <p className="text-center">單品價錢</p>
                <p className="text-center">數量</p>
                <p className="text-center">小計</p>
                <p className="text-center" />
              </div>
              <hr />
              <div className="item-content">
                {/* ✅ 只讀取購物車內容，不做刪除或數量變更 */}
                {cart.map((item) => (
                  <CartItem
                    key={item.cart_item_id} // ✅ 確保 `key` 唯一性
                    product_id={item.product_id}
                    product_name={item.product_name}
                    product_image={item.product_image}
                    product_price={item.product_price}
                    quantity={item.quantity}
                    subtotal={item.product_price * item.quantity} // ✅ 計算小計
                    onQuantityChange={(change) =>
                      handleQuantityChange(item.cart_item_id, change)
                    }
                    onDelete={() => handleDelete(item.cart_item_id)}
                  />
                ))}
              </div>
              <CouponSelector />
            </article>
            <hr />
            {/* ✅ 計算總金額 */}
            <CartSummary total={totalPrice} />
          </div>
        </div>
      </section>
      <ToastContainerComponent />
    </>
  );
}
