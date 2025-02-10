"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import SearchBar from "./search-bar";
import { Modal, Button } from "react-bootstrap";

export default function PurchaseHistoryDetails() {
  const { data: session, status } = useSession();
  const [searchTerm, setSearchTerm] = useState("");
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);

  useEffect(() => {
    if (status === "loading") return; // 等待會話加載完成

    if (!session) {
      console.error("No session found");
      return;
    }

    const userId = session.user.id; // 從會話中獲取用戶 ID

    axios
      .get(`/api/member/orders/${userId}`) // 在 API 請求中包含 userId
      .then((response) => {
        setOrders(response.data);
      })
      .catch((error) => {
        console.error("There was an error fetching the orders!", error);
      });
  }, [session, status]);

  const handleSearch = (term) => {
    setSearchTerm(term.toLowerCase());
    // 在這裡處理搜尋邏輯
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setSelectedOrder(null);
  };

  const formatAmount = (amount) => {
    return amount.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const filteredOrders = orders.filter(
    (order) =>
      order.order_id.toString().toLowerCase().includes(searchTerm) ||
      order.total_amount.toString().toLowerCase().includes(searchTerm) ||
      (order.payment_status &&
        order.payment_status.toString().toLowerCase().includes(searchTerm)) ||
      (order.order_status &&
        order.order_status.toString().toLowerCase().includes(searchTerm)) ||
      (order.product_name &&
        order.product_name.toString().toLowerCase().includes(searchTerm)) ||
      (order.order_created_at &&
        new Date(order.order_created_at)
          .toLocaleDateString()
          .toLowerCase()
          .includes(searchTerm))
  );

  return (
    <div className="purchase-history-details container">
      <h1>訂單歷史</h1>
      <span>
        要更詳細地查看訂單並查看與該訂單關聯的鍵，只需單擊相應訂單的檢視訂單。
      </span>
      <SearchBar placeholder="搜尋訂單..." onSearch={handleSearch} />
      <div className="order-table table table-striped">
        <div className="order-table-header thead-dark">
          <span>商品名稱</span>
          <span>日期</span>
          <span>總金額</span>
          <span>付款狀態</span>
          <span>訂單狀態</span>
          <span>詳細訊息</span>
        </div>
        {filteredOrders.map((order, index) => (
          <div className="order-table-row" key={index}>
            <span>{order.product_name}</span>
            <span>{new Date(order.order_created_at).toLocaleDateString()}</span>
            <span>{formatAmount(order.total_amount)}</span>
            <span>{order.payment_status}</span>
            <span>{order.order_status}</span>
            <span>
              <button
                className="view-order-button btn btn-link"
                onClick={() => handleViewOrder(order)}
              >
                檢視訂單
              </button>
            </span>
          </div>
        ))}
      </div>

      {selectedOrder && (
        <Modal
          show={modalIsOpen}
          onHide={closeModal}
          dialogClassName="modal-custom"
        >
          <Modal.Header closeButton>
            <Modal.Title>訂單詳細資訊</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>訂單編號: {selectedOrder.order_id}</p>
            <p>商品名稱: {selectedOrder.product_name}</p>
            <p>
              訂單日期:{" "}
              {new Date(selectedOrder.order_created_at).toLocaleDateString()}
            </p>
            <p>總金額: {formatAmount(selectedOrder.total_amount)}</p>
            <p>付款狀態: {selectedOrder.payment_status}</p>
            <p>訂單狀態: {selectedOrder.order_status}</p>
            <p>商品描述: {selectedOrder.product_description}</p>
            <p>商品單價: {formatAmount(selectedOrder.product_unit_price)}</p>
            <p>商品庫存: {selectedOrder.product_stock}</p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeModal}>
              關閉
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
}
