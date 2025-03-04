"use client";
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import SearchBar from "./search-bar";
import Swal from "sweetalert2";
import Pagination from "./Pagination";
import { ClipLoader } from "react-spinners"; // 引入 react-spinners
import { motion, AnimatePresence } from "framer-motion"; // 引入 framer-motion
import Link from "next/link";

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
  const [loading, setLoading] = useState(true); // 加載狀態
  const [animatingSearch, setAnimatingSearch] = useState(false);
  const [animatingFilter, setAnimatingFilter] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (status === "loading") return; // 等待會話加載完成

    if (!session) {
      Swal.fire({
        icon: "error",
        title: "請先登入",
        text: "請先登入會員",
        confirmButtonColor: "#5b4034",
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
        setLoading(false); // 數據加載完成
      })
      .catch((error) => {
        setLoading(false); // 數據加載完成
        if (error.response && error.response.status === 404) {
          console.log("沒有訂單紀錄");
        } else {
          console.error("There was an error fetching the orders!", error);
        }
      });
  }, [session, status]);

  const handleSearch = (term) => {
    setAnimatingSearch(true);
    setSearchTerm(term.toLowerCase());
    setCurrentPage(1); // 重置頁碼確保能看到結果

    setTimeout(() => {
      setAnimatingSearch(false);
    }, 300);
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

    // 添加延遲，確保內容更新後再滾動
    setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 100);
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
    <div className="purchase-history-details">
      <h1>訂單歷史</h1>
      <span>
        要更詳細地查看訂單並查看與詈訂單關聯的鍵，只需單擊相應訂單的檢視訂單。
      </span>
      <SearchBar placeholder="搜尋訂單..." onSearch={handleSearch} />
      {searchTerm && (
        <div className="active-filters">
          <span className="filter-tag">
            搜尋: "{searchTerm}"{" "}
            <button className="tag-remove" onClick={() => handleSearch("")}>
              ×
            </button>
          </span>
        </div>
      )}
      <div
        ref={containerRef}
        className={`orders-container ${animatingSearch ? "searching" : ""}`}
      >
        <AnimatePresence mode="wait">
          {loading ? (
            Array(itemsPerPage)
              .fill()
              .map((_, index) => (
                <motion.div
                  key={index}
                  className="sm-skeleton"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              ))
          ) : (
            <motion.div
              className="order-table"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {paginatedOrders.length === 0 ? (
                <motion.div
                  className="no-data"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <p>
                    {searchTerm ? "沒有符合搜尋條件的訂單" : "沒有購買紀錄"}
                  </p>
                </motion.div>
              ) : (
                paginatedOrders.map((order, index) => (
                  <motion.div
                    className="order-card"
                    key={order.order_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      transition: { delay: index * 0.05 },
                    }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    layout
                  >
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
                      <span>
                        NT$
                        {formatAmount(
                          order.total_amount +
                            (order.delivery_method === "home_delivery"
                              ? 100
                              : order.delivery_method === "7-11"
                              ? 60
                              : 0)
                        )}
                      </span>
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
                          handleConvertPoints(
                            order.order_id,
                            order.total_amount
                          );
                        }}
                        disabled={
                          order.payment_status !== 1 ||
                          converting[order.order_id]
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
                      <div className="order-details"></div>
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
                          <div className="text ms-3">
                            {<p>收件人姓名: {order.recipient_name}</p>}
                            {<p>收件人電話: {order.recipient_phone}</p>}
                            {<p>收件地址: {order.shipping_address}</p>}
                            {
                              <p>
                                付款方式:
                                {order.payment_method === "cod"
                                  ? "信用卡"
                                  : order.payment_method === "null"
                                  ? "貨到付款"
                                  : order.payment_method}
                              </p>
                            }
                          </div>
                          <div className="text-end fw-bold ">
                            單價: NT$
                            {Number(product.unit_price).toLocaleString(
                              "en-US",
                              {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              }
                            )}
                            <br /> 數量: {product.quantity}
                            <br />
                            小計: NT$
                            {formatAmount(
                              product.unit_price * product.quantity
                            )}
                          </div>
                          <div className="text-end fw-bold ">
                            {idx === order.products.length - 1 && (
                              <div className="text-end fw-bold ">
                                <p>
                                  配送方式:{" "}
                                  {order.delivery_method === "home_delivery"
                                    ? "宅配"
                                    : order.delivery_method === "7-11"
                                    ? "超商"
                                    : order.delivery_method}
                                </p>
                                <p>
                                  運費：{" "}
                                  {order.delivery_method === "home_delivery"
                                    ? "$100"
                                    : order.delivery_method === "7-11"
                                    ? "$60"
                                    : order.delivery_method}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                      <div className="points-convert-info flex justify-content-between">
                        <p>
                          <i className="bi bi-info-circle " />
                          使用的優惠券: {order.used_coupon}
                          <br />
                          可兌換點數: {Math.floor(
                            order.total_amount * 0.001
                          )}{" "}
                          點
                        </p>
                        <div className="d-flex">
                          <Link href={`/member/reviews/${order.order_id}`}>
                            <button className="points-convert-btn  ">
                              寫下評論
                            </button>
                          </Link>
                          <Link
                            href={`/product-cart/order-confirmation/${order.order_id}`}
                          >
                            <button className="points-convert-btn ms-3 ">
                              查看明細
                            </button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="pagination-container">
        {filteredOrders.length > itemsPerPage && (
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
