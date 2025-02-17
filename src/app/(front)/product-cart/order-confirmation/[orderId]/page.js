"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import styles from "@/styles/pages/product-cart/order-confirmation/order-confirmation.module.css"; // ✅ 使用 CSS Modules

export default function OrderConfirmation() {
  const router = useRouter();
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

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
      } finally {
        setLoading(false);
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
        <h2 className={styles.textCenter}>訂單已成立</h2>
        <p className={styles.textCenter}>
          感謝您的訂購！您的訂單詳細資訊如下：
        </p>

        {/* ✅ 訂單基本資訊 */}
        <section className={styles.orderInfo}>
          <div className={styles.orderDetails}>
            <p>
              <strong>訂單編號：</strong> {order?.order_id}
            </p>
            <p>
              <strong>訂單金額：</strong> NT$ {order?.total_amount}
            </p>
            <p>
              <strong>付款方式：</strong> {order?.payment_method}
            </p>
            <p>
              <strong>配送方式：</strong> {order?.delivery_method}
            </p>
          </div>
          <div className={styles.recipientInfo}>
            <p>
              <strong>收件人：</strong> {order?.recipient_name}
            </p>
            <p>
              <strong>聯絡電話：</strong> {order?.recipient_phone}
            </p>
            <p>
              <strong>配送地址：</strong> {order?.shipping_address}
            </p>
          </div>
        </section>

        {/* ✅ 訂單商品列表 */}
        <section className={styles.orderItems}>
          <h3>訂購商品</h3>
          <div className={styles.itemsList}>
            {order?.items?.map((item) => (
              <div key={item.product_id} className={styles.item}>
                <img
                  src={`/images/products/${item.product_image}`}
                  alt={item.product_name}
                  className={styles.itemImage}
                />
                <div className={styles.itemInfo}>
                  <p className={styles.itemName}>{item.product_name}</p>
                  <p>數量：{item.quantity}</p>
                  <p>小計：NT$ {item.product_price * item.quantity}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ✅ 前往付款按鈕 */}
        <div className={styles.textCenter}>
          <Link href={`/payment?order_id=${order?.order_id}`}>
            <button className={styles.btnPrimary}>前往付款</button>
          </Link>
        </div>
      </div>
    </main>
  );
}
