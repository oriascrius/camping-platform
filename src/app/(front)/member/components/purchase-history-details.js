"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import SearchBar from "./search-bar";

export default function PurchaseHistoryDetails() {
  const { data: session, status } = useSession();
  const [searchTerm, setSearchTerm] = useState("");
  const [orders, setOrders] = useState([]);

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
    setSearchTerm(term);
    // 在這裡處理搜尋邏輯
  };

  const filteredOrders = orders.filter((order) =>
    order.product.includes(searchTerm)
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
          <span>日期</span>
          <span>總金額</span>
          <span>付款狀態</span>
          <span>訂單狀態</span>
          <span>詳細訊息</span>
        </div>
        {filteredOrders.map((order, index) => (
          <div className="order-table-row" key={index}>
            <span>{order.created_at}</span>
            <span>{order.total_amount}</span>
            <span>{order.payment_status}</span>
            <span>{order.order_status}</span>
            <span>
              <button className="view-order-button btn btn-link">
                檢視訂單
              </button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
