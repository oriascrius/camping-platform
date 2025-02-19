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
  // const modalRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 6; // 每頁顯示的訂單數量
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [converting, setConverting] = useState({});

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

  // const handleViewOrder = (order) => {
  //   setSelectedOrder(order);
  //   if (modalRef.current) {
  //     modalRef.current.style.display = "block"; // 顯示模態框
  //   }
  // };

  // const closeModal = () => {
  //   if (modalRef.current) {
  //     modalRef.current.style.display = "none"; // 隱藏模態框
  //   }
  //   setSelectedOrder(null);
  // };

  // const handleBackgroundClick = (e) => {
  //   if (e.target === modalRef.current) {
  //     closeModal();
  //   }
  // };

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
  const handleConvertPoints = async (orderId, amount) => {
    try {
      setConverting((prev) => ({ ...prev, [orderId]: true }));

      const response = await axios.post(
        `/api/member/orders/${session.user.id}`,
        {
          userId: session.user.id,
          orderId,
          points: Math.floor(amount * 0.001), // 假設1元=.001積分
        }
      );

      if (response.data.success) {
        Swal.fire({
          icon: "success",
          title: "點數兌換成功!",
          html: `獲得積分: <b>${response.data.points}</b>`,
          confirmButtonColor: "#5B4034",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "兌換失敗",
        text: error.response?.data?.message || "已兌換過點數",
        confirmButtonColor: "#9B7A5A",
      });
    } finally {
      setConverting((prev) => ({ ...prev, [orderId]: false }));
    }
  };
  return (
    <div className="purchase-history-details ">
      <h1>訂單歷史</h1>
      <span>
        要更詳細地查看訂單並查看與該訂單關聯的鍵，只需單擊相應訂單的檢視訂單。
      </span>
      <SearchBar placeholder="搜尋訂單..." onSearch={handleSearch} />
      <div className="order-table">
        {paginatedOrders.map((order) => (
          <div className="order-card" key={order.order_id}>
            <div
              className={`order-card-header ${
                expandedOrder === order.order_id ? "active" : ""
              }`}
              onClick={() =>
                setExpandedOrder((prev) =>
                  prev === order.order_id ? null : order.order_id
                )
              }
            >
              <span>#{order.order_id}</span>
              <span>
                {new Date(order.order_created_at).toLocaleDateString()}
              </span>
              <span>NT${formatAmount(order.total_amount)}</span>
              <span className={`status-${order.payment_status}`}>
                {getPaymentStatus(order.payment_status)}
              </span>
              <span className={`status-${order.order_status}`}>
                {getOrderStatus(order.order_status)}
              </span>
              <button
                className="points-convert-btn ms-3"
                onClick={(e) => {
                  e.stopPropagation();
                  handleConvertPoints(order.order_id, order.total_amount);
                }}
                disabled={
                  order.payment_status !== 1 || converting[order.order_id]
                }
              >
                {converting[order.order_id] ? (
                  <>
                    <span className="spinner-border spinner-border-sm" />
                    兌換中...
                  </>
                ) : (
                  <>
                    <i className="bi bi-arrow-repeat" />
                    兌換點數
                  </>
                )}
              </button>
            </div>

            <div
              className={`order-card-content ${
                expandedOrder === order.order_id ? "expanded" : ""
              }`}
            >
              {order.products?.map((product, idx) => (
                <div className="product-item" key={idx}>
                  {product.image ? (
                    <img
                      src={`/images/products/${product.image}`}
                      alt={product.name}
                      style={{ borderRadius: "8px" }}
                    />
                  ) : (
                    <img
                      src="/images/products/default.png"
                      alt={product.name}
                      style={{ borderRadius: "8px" }}
                    />
                  )}
                  <div>
                    <h5>{product.name}</h5>
                    <small>{product.description}</small>
                  </div>
                  <div className="ms-3">
                    單價: NT${formatAmount(product.unit_price)}
                  </div>
                  <div className="ms-3">數量: {product.quantity}</div>
                  <div className="text-end">
                    小計: NT$
                    {formatAmount(product.unit_price * product.quantity)}
                  </div>
                </div>
              ))}

              <div className="points-convert-info">
                <i className="bi bi-info-circle" />
                可兌換點數: {Math.floor(order.total_amount * 0.001)} 點
              </div>
            </div>
          </div>
        ))}
      </div>
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
