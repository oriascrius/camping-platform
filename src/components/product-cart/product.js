"use client";

import { useEffect } from "react";
import { useProductCart } from "@/hooks/useProductCart"; // ✅ 使用購物車鉤子
import CartHeader from "./cart-header";
import CartItem from "./cart-item";
import CartSummary from "./cart-summary";
import CouponSelector from "./coupon-selector";

export default function Product() {
  const { cart, fetchCart } = useProductCart(); // ✅ 取得購物車內容與 API 函數

  // ✅ 頁面載入時，讀取購物車
  useEffect(() => {
    fetchCart();
    console.log(cart);
  }, [fetchCart]);

  // ✅ 更新數量 (目前註解)
  // const handleQuantityChange = async (id, change) => {
  //   try {
  //     const res = await fetch("/api/product-cart", {
  //       method: "PUT",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ productId: id, change }),
  //     });

  //     if (!res.ok) throw new Error("更新數量失敗");
  //     fetchCart(); // 更新購物車
  //   } catch (error) {
  //     console.error("數量變更錯誤:", error);
  //   }
  // };

  // ✅ 刪除商品 (目前註解)
  // const handleDelete = async (id) => {
  //   try {
  //     const res = await fetch(`/api/product-cart?productId=${id}`, {
  //       method: "DELETE",
  //     });

  //     if (!res.ok) throw new Error("刪除失敗");
  //     fetchCart(); // 更新購物車
  //   } catch (error) {
  //     console.error("刪除商品錯誤:", error);
  //   }
  // };

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
                    product_name={item.product_name}
                    product_image={item.product_image}
                    product_price={item.product_price}
                    quantity={item.quantity}
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
            <CartSummary
              total={cart.reduce((sum, item) => sum + item.subtotal, 0)}
            />
          </div>
        </div>
      </section>
    </>
  );
}
