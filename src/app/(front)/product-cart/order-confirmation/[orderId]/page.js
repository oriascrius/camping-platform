"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import PaymentModal from "@/components/product-cart/checkout/PaymentModal";
import styles from "@/styles/pages/product-cart/order-confirmation/order-confirmation.module.css"; // ✅ 使用 CSS Modules

export default function OrderConfirmation() {
  const router = useRouter();
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);

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

  // 判斷按鈕顯示內容
  const showPaymentButton =
    order?.payment_status === 0 && order?.payment_method === "credit_card";

  async function fetchOrderDetails(orderId) {
    const res = await fetch(`/api/product-cart/orders/${orderId}`);
    if (!res.ok) throw new Error("訂單資訊獲取失敗");
    return await res.json();
  }

  return (
    <main className={styles.orderConfirmation}>
      <div className={styles.container}>
        <img
          src="/images/product-cart/completed.png"
          className={`d-flex mx-auto mb-5 mt-3 ${styles.okImg}`}
        />

        <h2 className={`${styles.textCenter} ${styles.orderTitleStyle}`}>
          訂單已成立
        </h2>
        <p className={`${styles.textCenter} ${styles.orderConfirP}`}>
          感謝您的訂購！您的訂單詳細資訊如下：
        </p>

        {/* ✅ 訂單基本資訊 */}
        <section className={styles.orderInfo}>
          <div className={styles.orderTitleStyle}>收件人資料</div>

          <div className="p-4">
            <div className={styles.orderDetails}>
              <p className={`${styles.orderConfirP}`}>
                <strong>訂單編號：</strong> {order?.order_id}
              </p>
              <p className={`${styles.orderConfirP}`}>
                <strong>訂單總額：</strong> NT$ {order?.total_amount}
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
                {order?.delivery_method === "home_delivery" ? (
                  <>
                    宅配到府
                    <span className={`ms-2 ${styles.couponNote}`}>
                      (運費 $100)
                    </span>
                  </>
                ) : order?.delivery_method === "7-11" ? (
                  <>
                    寄送到 7-11
                    <span className={`ms-2 ${styles.couponNote}`}>
                      (運費 $60)
                    </span>
                  </>
                ) : (
                  "其他"
                )}
              </p>
              {order?.used_coupon && (
                <p className={`${styles.orderConfirP}`}>
                  <strong>使用優惠卷: </strong>
                  {order?.used_coupon}
                  <span className={`ms-2 ${styles.couponNote}`}>
                    (訂單金額已折抵)
                  </span>
                </p>
              )}
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
              <p className={`${styles.orderConfirP}`}>
                <strong>備註：</strong> {order?.note}
              </p>
              <p className={`${styles.orderConfirP}`}>
                <strong>付款狀態：</strong>{" "}
                <span
                  className={
                    order?.payment_status === 0
                      ? styles.paymentUnpaid
                      : styles.paymentPaid
                  }
                >
                  {order?.payment_status === 0 ? "未付款" : "已付款"}
                </span>
              </p>
            </div>
          </div>
        </section>

        {/* ✅ 訂單商品列表 */}
        <section className={styles.orderItems}>
          <h3 className={`${styles.orderTitleStyle} mb-3`}>訂購商品</h3>
          <div className="p-4">
            <div className={styles.itemsList}>
              {order?.items?.map((item) => (
                <div key={item.product_id} className={styles.item}>
                  <Link
                    href={`/products/${item.product_id}`}
                    className={styles.link}
                  >
                    <img
                      src={`/images/products/${item.product_image}`}
                      alt={item.product_name}
                      className={styles.itemImage}
                    />
                  </Link>

                  <div className={styles.itemInfo}>
                    <Link
                      href={`/products/${item.product_id}`}
                      className={styles.link}
                    >
                      <p
                        className={`${styles.itemName} ${styles.orderConfirP} ${styles.textCenter}`}
                      >
                        {item.product_name}
                      </p>
                    </Link>

                    <p
                      className={`${styles.orderConfirP} ${styles.textCenter}`}
                    >
                      數量：{item.quantity}
                    </p>
                    <p
                      className={`${styles.orderConfirP} ${styles.textCenter}`}
                    >
                      單價$ {item.product_price}
                    </p>
                    <p
                      className={`${styles.orderConfirP} ${styles.textCenter}`}
                    >
                      小計：NT$ {item.product_price * item.quantity}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ✅ 前往付款按鈕流程判斷*/}
        <div className={styles.textCenter}>
          {showPaymentButton ? (
            <button
              className={`${styles.btnGoToPayment} mt-3`}
              onClick={() => setShowModal(true)}
            >
              前往結帳
            </button>
          ) : (
            <Link href="/member/orders">
              <button className={`${styles.btnGoToPayment} mt-3`}>
                回到訂單列表
              </button>
            </Link>
          )}
        </div>

        {/* Payment Modal */}
        <PaymentModal
          orderId={order?.order_id}
          totalAmount={order?.total_amount}
          showModal={showModal}
          closeModal={() => setShowModal(false)}
        />
      </div>
    </main>
  );
}
