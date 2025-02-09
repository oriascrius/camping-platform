"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import SearchBar from "./search-bar";
import SortAndFilter from "./sort-filter";
import "bootstrap-icons/font/bootstrap-icons.css";

export default function WishlistDetails() {
  const { data: session, status } = useSession();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("");
  const [filterOption, setFilterOption] = useState("");
  const [wishlistItems, setWishlistItems] = useState([]);

  useEffect(() => {
    if (status === "loading") return; // 等待會話加載完成

    if (!session) {
      console.error("No session found");
      return;
    }

    const userId = session.user.id; // 從會話中獲取用戶 ID

    axios
      .get(`/api/member/wishlist/${userId}`) // 在 API 請求中包含 userId
      .then((response) => {
        setWishlistItems(response.data);
      })
      .catch((error) => {
        console.error("There was an error fetching the wishlist items!", error);
      });
  }, [session, status]);

  const handleSearch = (term) => {
    setSearchTerm(term);
    // 在這裡處理搜尋邏輯
  };

  const handleSortChange = (option) => {
    setSortOption(option);
    // 在這裡處理排序邏輯
  };

  const handleFilterChange = (option) => {
    setFilterOption(option);
    // 在這裡處理篩選邏輯
  };

  const filteredWishlistItems = wishlistItems.filter((item) =>
    item.title ? item.title.includes(searchTerm) : false
  );

  const sortOptions = [
    { value: "", label: "未選擇" },
    { value: "date", label: "日期" },
    { value: "popularity", label: "人氣" },
  ];

  const filterOptions = [
    { value: "", label: "未選擇" },
    { value: "type1", label: "類型1" },
    { value: "type2", label: "類型2" },
  ];

  return (
    <div className="wishlist-details">
      <h1>願望清單</h1>
      <SortAndFilter
        sortOptions={sortOptions}
        filterOptions={filterOptions}
        onSortChange={handleSortChange}
        onFilterChange={handleFilterChange}
      />
      <SearchBar placeholder="搜尋願望清單..." onSearch={handleSearch} />
      {/* 其他願望清單的內容 */}
      {filteredWishlistItems.map((item, index) => (
        <div className="wishlist-item" key={index}>
          <div className="wishlist-image">
            <img
              src="/images/member/1498.jpg"
              alt={item.title}
              style={{ borderRadius: "8px" }}
            />
          </div>
          <div className="wishlist-content">
            <div className="wishlist-title">{item.title}</div>
            <div className="wishlist-subtitle">{item.subtitle}</div>
            <div className="wishlist-text">{item.text}</div>
            <div className="wishlist-date">{item.date}</div>
            <div className="wishlist-price">{item.price}</div>
            <div className="wishlist-actions">
              <button>新增到購物車</button>
              <button className="delete-button">刪除</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
