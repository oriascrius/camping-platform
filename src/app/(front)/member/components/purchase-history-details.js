"use client";
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import SearchBar from "./search-bar";
import Swal from "sweetalert2";
import Pagination from "./Pagination";

export default function PurchaseHistoryDetails() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const modalRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 6; // 每頁顯示的訂單數量

  useEffect(() => {
    if (status === "loading") return; // 等待會話加載完成

    if (!session) {
      Swal.fire({
        icon: "error",
        title: "請先登入",
        text: "請先登入會員",
      });
      router.push("/auth/login");
      return;
    }

    const userId = session.user.id; // 從會話中獲取用戶 ID

    axios
      .get(`/api/member/orders/${userId}`) // 在 API 請求中包含 userId
      .then((response) => {
        setOrders(response.data);
        setTotalPages(Math.ceil(response.data.length / itemsPerPage));
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
    if (modalRef.current) {
      modalRef.current.style.display = "block"; // 顯示模態框
    }
  };

  const closeModal = () => {
    if (modalRef.current) {
      modalRef.current.style.display = "none"; // 隱藏模態框
    }
    setSelectedOrder(null);
  };

  const handleBackgroundClick = (e) => {
    if (e.target === modalRef.current) {
      closeModal();
    }
  };

  const formatAmount = (amount) => {
    return amount.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const getPaymentStatus = (status) => {
    // 0: 未付款, 1: 已付款 2: 退貨
    return status === 0 ? "未付款" : status === 1 ? "已付款" : "退貨";
  };

  const getOrderStatus = (status) => {
    // 0: 待處理, 1: 處理中, 2:已完成,3: 已取消
    return status === 0
      ? "待處理"
      : status === 1
      ? "處理中"
      : status === 2
      ? "已完成"
      : "已取消";
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const filteredOrders = orders.filter(
    (order) =>
      order.order_id.toString().toLowerCase().includes(searchTerm) ||
      order.total_amount.toString().toLowerCase().includes(searchTerm) ||
      (order.payment_status &&
        getPaymentStatus(order.payment_status)
          .toString()
          .toLowerCase()
          .includes(searchTerm)) ||
      (order.order_status &&
        getOrderStatus(order.order_status)
          .toString()
          .toLowerCase()
          .includes(searchTerm)) ||
      (order.product_name &&
        order.product_name.toString().toLowerCase().includes(searchTerm)) ||
      (order.order_created_at &&
        new Date(order.order_created_at)
          .toLocaleDateString()
          .toLowerCase()
          .includes(searchTerm))
  );

  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
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
          <span>訂單編號</span>
          <span>日期</span>
          <span>總金額</span>
          <span>付款狀態</span>
          <span>訂單狀態</span>
          <span>詳細訊息</span>
        </div>
        {paginatedOrders.map((order, index) => (
          <div className="order-table-row" key={index}>
            <span>{order.order_id}</span>
            <span>{new Date(order.order_created_at).toLocaleDateString()}</span>
            <span>{formatAmount(order.total_amount)}</span>
            <span>{getPaymentStatus(order.payment_status)}</span>
            <span>{getOrderStatus(order.order_status)}</span>
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
        <div
          id="orderModal"
          className="modal"
          ref={modalRef}
          onClick={handleBackgroundClick}
        >
          <div className="modal-content">
            <span className="close" onClick={closeModal}>
              &times;
            </span>
            <h2>訂單詳細資訊</h2>
            <p>訂單編號: {selectedOrder.order_id}</p>
            <ul>
              {selectedOrder.products &&
              Array.isArray(selectedOrder.products) ? (
                selectedOrder.products.map((product, index) => (
                  <li key={index}>
                    <p>商品名稱: {product.name}</p>
                    <p>商品描述: {product.description || "沒有商品描述"}</p>
                    <p>
                      商品單價:{" "}
                      {product.unit_price
                        ? formatAmount(product.unit_price)
                        : "無效的金額"}
                    </p>
                    <p>購買數量: {product.quantity}</p>
                  </li>
                ))
              ) : (
                <li>沒有商品資訊</li>
              )}
            </ul>
            <p>
              訂單日期:{" "}
              {selectedOrder.order_created_at
                ? new Date(selectedOrder.order_created_at).toLocaleDateString()
                : "無效的日期"}
            </p>
            <p>
              總金額:{" "}
              {formatAmount(
                selectedOrder.products.reduce(
                  (total, product) =>
                    total + product.quantity * product.unit_price,
                  0
                )
              )}
            </p>
            <p>付款狀態: {getPaymentStatus(selectedOrder.payment_status)}</p>
            <p>訂單狀態: {getOrderStatus(selectedOrder.order_status)}</p>
            <p>
              總購買數量:{" "}
              {selectedOrder.products
                ? selectedOrder.products.reduce(
                    (total, product) => total + product.quantity,
                    0
                  )
                : "無效的數量"}
            </p>
          </div>
        </div>
      )}
      <div className="pagination-container">
        {orders.length > itemsPerPage && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </div>
  );
}
