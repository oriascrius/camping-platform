"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import styles from "@/styles/pages/product-cart/order-confirmation/order-confirmation.module.css"; // ✅ 使用 CSS Modules

export default function OrderConfirmation() {
  const router = useRouter();
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (!orderId) {
      router.push("/"); // 如果沒有 order_id，自動導回首頁
      return;
    }

    async function fetchOrder() {
      try {
        const data = await fetchOrderDetails(orderId);
        setOrder(data);
      } catch (error) {
        console.error("取得訂單資訊錯誤:", error);
      }
    }

    fetchOrder();
  }, [orderId, router]);

  async function fetchOrderDetails(orderId) {
    const res = await fetch(`/api/product-cart/orders/${orderId}`);
    if (!res.ok) throw new Error("訂單資訊獲取失敗");
    return await res.json();
  }

  return (
    <main className={styles.orderConfirmation}>
      <div className={styles.container}>
        <h2 className={`${styles.textCenter} ${styles.orderTitleStyle}`}>
          訂單已成立
        </h2>
        <p className={`${styles.textCenter} ${styles.orderConfirP}`}>
          感謝您的訂購！您的訂單詳細資訊如下：
        </p>

        {/* ✅ 訂單基本資訊 */}
        <section className={styles.orderInfo}>
          <div className={styles.orderDetails}>
            <p className={`${styles.orderConfirP}`}>
              <strong>訂單編號：</strong> {order?.order_id}
            </p>
            <p className={`${styles.orderConfirP}`}>
              <strong>訂單金額：</strong> NT$ {order?.total_amount}
            </p>
            <p className={`${styles.orderConfirP}`}>
              <strong>付款方式：</strong>{" "}
              {order?.payment_method === "credit_card"
                ? "信用卡付款"
                : order?.payment_method === "cod"
                ? "貨到付款"
                : "其他"}
            </p>
            <p className={`${styles.orderConfirP}`}>
              <strong>配送方式：</strong>{" "}
              {order?.delivery_method === "home_delivery"
                ? "宅配到府"
                : order?.delivery_method === "7-11"
                ? "寄送到 7-11"
                : "其他"}
            </p>
          </div>
          <div className={styles.recipientInfo}>
            <p className={`${styles.orderConfirP}`}>
              <strong>收件姓名：</strong> {order?.recipient_name}
            </p>
            <p className={`${styles.orderConfirP}`}>
              <strong>聯絡電話：</strong> {order?.recipient_phone}
            </p>
            <p className={`${styles.orderConfirP}`}>
              <strong>配送地址：</strong> {order?.shipping_address}
            </p>
          </div>
        </section>

        {/* ✅ 訂單商品列表 */}
        <section className={styles.orderItems}>
          <h3 className={`${styles.orderTitleStyle} mb-3`}>訂購商品</h3>
          <div className={styles.itemsList}>
            {order?.items?.map((item) => (
              <div key={item.product_id} className={styles.item}>
                <img
                  src={`/images/products/${item.product_image}`}
                  alt={item.product_name}
                  className={styles.itemImage}
                />
                <div className={styles.itemInfo}>
                  <p
                    className={`${styles.itemName} ${styles.orderConfirP} ${styles.textCenter}`}
                  >
                    {item.product_name}
                  </p>
                  <p className={`${styles.orderConfirP} ${styles.textCenter}`}>
                    數量：{item.quantity}
                  </p>
                  <p className={`${styles.orderConfirP} ${styles.textCenter}`}>
                    小計：NT$ {item.product_price * item.quantity}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ✅ 前往付款按鈕 */}
        <div className={styles.textCenter}>
          <Link href={`/payment?order_id=${order?.order_id}`}>
            <button className={`${styles.btnGoToPayment} mt-3`}>
              前往付款
            </button>
          </Link>
        </div>
      </div>
    </main>
  );
}
