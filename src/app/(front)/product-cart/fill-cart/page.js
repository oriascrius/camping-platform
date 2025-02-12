"use client"; // 指定這個檔案是 Client Component
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation"; // Next.js 13 使用的路由 hook
import { useProductCart } from "@/hooks/useProductCart";

// 子元件
import OrderSteps from "@/components/product-cart/checkout/OrderSteps";
import CartProducts from "@/components/product-cart/checkout/CartProducts";
import DeliveryOptions from "@/components/product-cart/checkout/DeliveryOptions";
import PaymentOptions from "@/components/product-cart/checkout/PaymentOptions";
import OrderSummary from "@/components/product-cart/checkout/OrderSummary";
import CustomerInfoForm from "@/components/product-cart/checkout/CustomerInfoForm";

// 樣式
import "@/styles/pages/product-cart/fill-cart/style.css";

/**
 * FillCart 組件：顯示結帳流程、表單並處理「送出訂單」的核心邏輯。
 */
export default function FillCart() {
  /**
   * 1. 取得路由物件，以便提交成功後可導向其他頁面
   */
  const router = useRouter();

  /*
   * 2. 從自訂 Hook 取得購物車資料 (cart)
   */
  const { cart, fetchCart } = useProductCart();
  if (cart.length === 0) {
    fetchCart();
  }

  /**
   * 3. 建立 state：用於存放「配送方式」及「付款方式」
   *
   *    - 預設選擇 "home_delivery" (宅配) 和 "credit_card" (信用卡)
   */
  const [deliveryMethod, setDeliveryMethod] = useState("home_delivery");
  const [paymentMethod, setPaymentMethod] = useState("credit_card");

  /**
   * 4. 建立 state：用於存放「顧客資訊」
   *    - 可依照實際需求增加或刪除欄位
   */
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    note: "",
  });

  /**
   * 5. 當子元件 (CustomerInfoForm) 中的 input 改變時觸發
   *    - 根據 event.target 的 name / value 來更新對應的 customerInfo 欄位
   */
  const handleCustomerInfoChange = (e) => {
    const { name, value } = e.target;
    setCustomerInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /**
   * 6. 父層處理配送方式 (由 <DeliveryOptions> 傳回來)
   */
  const handleDeliveryChange = (method) => {
    setDeliveryMethod(method);
  };

  /**
   * 7. 父層處理付款方式 (由 <PaymentOptions> 傳回來)
   */
  const handlePaymentChange = (method) => {
    setPaymentMethod(method);
  };

  /**
   * 8. 計算商品小計 (subtotal)
   *    - 假設 cart 裡的每個 item 都有 product_price 與 quantity
   */
  const subtotal = cart.reduce(
    (sum, item) => sum + item.product_price * item.quantity,
    0
  );

  // 計算整筆訂單
  let totalAmount = subtotal;
  if (deliveryMethod === "7-11") {
    totalAmount = subtotal + 60;
  } else if (deliveryMethod === "home_delivery") {
    totalAmount = subtotal + 100;
  }

  /**
   * 9. 表單提交 (送出訂單) 邏輯
   *    - 阻止預設事件 (e.preventDefault())
   *    - 組合成一個 payload 送到後端 API (/api/orders)
   *    - 成功後利用 router.push() 導向訂單確認頁
   */
  const handleSubmitOrder = async (e) => {
    e.preventDefault(); // 阻止表單預設行為 (避免頁面刷新或跳轉)

    // 組合要送出的資料
    const payload = {
      cartItems: cart, // 購物車明細
      deliveryMethod, // 配送方式
      paymentMethod, // 付款方式
      customerInfo, // 顧客表單資訊
      totalAmount, //訂單小計
    };

    try {
      // 呼叫後端 API: POST /api/orders
      const res = await fetch("/api/product-cart/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // 如果響應狀態不是 2xx，視為失敗
        throw new Error("下單失敗，請稍後再試");
      }

      // 解析 JSON，取得 orderId
      const data = await res.json();
      if (!data.success || !data.orderId) {
        throw new Error("無法獲取訂單 ID，請稍後再試");
      }
      // 若成功，導向「訂單確認」頁面
      router.push(`/product-cart/order-confirmation/${data.orderId}`);
    } catch (error) {
      // 顯示錯誤訊息或做其他錯誤處理
      alert(error.message);
    }
  };

  /**
   * 10. 回傳 JSX: 使用 <form onSubmit={handleSubmitOrder}> 包覆整個頁面
   *    - 將各子元件 (配送、付款、商品、表單等) 放入表單區域
   *    - 最後以 <button type="submit"> 來觸發表單提交
   */
  return (
    <main className="fill-cart">
      {/* 包成表單，監聽 onSubmit 事件 */}
      <form onSubmit={handleSubmitOrder}>
        {/* 流程示意 (寫死的步驟) */}
        <OrderSteps />

        {/* 顯示購物車清單 */}
        <CartProducts cart={cart} subtotal={subtotal} />

        {/* 配送方式選擇 */}
        <DeliveryOptions
          deliveryMethod={deliveryMethod}
          onChange={handleDeliveryChange}
        />

        {/* 付款方式選擇 */}
        <PaymentOptions
          paymentMethod={paymentMethod}
          onChange={handlePaymentChange}
        />

        {/* 訂單摘要 (小計、運費、總金額等) */}
        <OrderSummary
          deliveryMethod={deliveryMethod}
          subtotal={subtotal}
          totalAmount={totalAmount}
        />

        {/* 顧客資訊表單：透過 props 傳遞狀態與 onChange */}
        <CustomerInfoForm
          customerInfo={customerInfo}
          onChange={handleCustomerInfoChange}
        />

        {/* 送出訂單按鈕 */}
        <button type="submit" className="submit">
          送出訂單
        </button>
      </form>
    </main>
  );
}
