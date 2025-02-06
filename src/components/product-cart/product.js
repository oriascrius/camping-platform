"use client";

import CartHeader from "./cart-header";
import CartItem from "./cart-item";
import CartSummary from "./cart-summary";
import CouponSelector from "./coupon-selector";

export default function Product() {
  const cartItems = [
    {
      id: 1,
      name: "晴空M 帳篷",
      image: "/images/product-cart/cart-1.png",
      price: 2700,
      quantity: 1,
      subtotal: 2700,
    },
    {
      id: 2,
      name: "晴空M 帳篷",
      image: "/images/product-cart/cart-2.png",
      price: 2700,
      quantity: 1,
      subtotal: 2700,
    },
  ];

  const handleQuantityChange = (id, change) => {
    console.log(`商品 ${id} 數量變更: ${change}`);
  };

  const handleDelete = (id) => {
    console.log(`刪除商品 ${id}`);
  };

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
                {cartItems.map((item) => (
                  <CartItem
                    key={item.id}
                    {...item}
                    onQuantityChange={(change) =>
                      handleQuantityChange(item.id, change)
                    }
                    onDelete={() => handleDelete(item.id)}
                  />
                ))}
              </div>
              <CouponSelector />
            </article>
            <hr />
            <CartSummary
              total={cartItems.reduce((sum, item) => sum + item.subtotal, 0)}
            />
          </div>
        </div>
      </section>
    </>
  );
}
