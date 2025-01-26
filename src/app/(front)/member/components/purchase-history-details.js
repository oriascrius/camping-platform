'use client';
import React, { useState } from 'react';
// import 'bootstrap/dist/css/bootstrap.min.css';
// import 'bootstrap-icons/font/bootstrap-icons.css';
import SearchBar from './search-bar';

export default function PurchaseHistoryDetails() {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (term) => {
    setSearchTerm(term);
    // 在這裡處理搜尋邏輯
  };

  const orders = [
    {
      date: '2024年8月20日',
      product: '4 人 1 房露營穿骨帳篷 Arpenaz 4.1',
      status: '交易完成',
    },
    {
      date: '2024年8月20日',
      product: '4 人 1 房露營穿骨帳篷 Arpenaz 4.1',
      status: '交易完成',
    },
    {
      date: '2024年8月20日',
      product: '4 人 1 房露營穿骨帳篷 Arpenaz 4.1',
      status: '交易完成',
    },
    // ...其他訂單...
  ];

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
          <span>商品</span>
          <span>狀態</span>
          <span>詳細訊息</span>
        </div>
        {filteredOrders.map((order, index) => (
          <div className="order-table-row" key={index}>
            <span>{order.date}</span>
            <span>{order.product}</span>
            <span>{order.status}</span>
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
