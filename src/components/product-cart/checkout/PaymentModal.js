"use client";

import { useEffect } from "react";
import { Modal, Button } from "react-bootstrap";

export default function PaymentModal({
  orderId,
  totalAmount,
  showModal,
  closeModal,
}) {
  useEffect(() => {
    if (!showModal) return;
  }, [showModal]);

  // ✅ 處理 LINE Pay 付款
  const handleLinePay = async () => {
    try {
      const res = await fetch("/api/product-cart/linepay/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: totalAmount, orderId }),
      });

      const data = await res.json();
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      }
    } catch (error) {
      console.error("付款請求失敗:", error);
    }
  };

  return (
    <Modal show={showModal} onHide={closeModal} centered>
      <Modal.Header closeButton>
        <Modal.Title>選擇付款方式</Modal.Title>
      </Modal.Header>
      <Modal.Body className="text-center">
        <Button
          variant="success"
          className="w-100 mb-2"
          onClick={handleLinePay}
        >
          使用 LINE Pay
        </Button>
        <Button
          variant="primary"
          className="w-100 mb-2"
          onClick={() => alert("信用卡付款功能未開放")}
        >
          信用卡付款
        </Button>
        <Button variant="secondary" className="w-100" onClick={closeModal}>
          取消
        </Button>
      </Modal.Body>
    </Modal>
  );
}
