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

  const handleAddToCart = (itemId) => {
    // 在這裡處理新增到購物車的邏輯
    console.log(`新增到購物車: ${itemId}`);
  };

  const handleDelete = (itemId) => {
    // 在這裡處理刪除的邏輯
    axios
      .delete(`/api/member/wishlist/${session.user.id}`, {
        data: { id: itemId },
      })
      .then(() => {
        setWishlistItems((prevItems) =>
          prevItems.filter((item) => item.id !== itemId)
        );
      })
      .catch((error) => {
        console.error("There was an error deleting the wishlist item!", error);
      });
  };

  const filteredWishlistItems = wishlistItems
    .filter((item) =>
      item.item_name ? item.item_name.includes(searchTerm) : false
    )
    .filter((item) => (filterOption ? item.type === filterOption : true));

  const sortOptions = [
    { value: "", label: "未選擇" },
    { value: "date", label: "日期" },
    { value: "popularity", label: "人氣" },
  ];

  const filterOptions = [
    { value: "", label: "未選擇" },
    { value: "product", label: "商品" },
    { value: "camp", label: "營地" },
  ];

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatPrice = (price) => {
    return price ? Math.floor(price).toLocaleString("zh-TW") : "";
  };

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
              src={item.item_image || "/images/member/1498.jpg"}
              alt={item.item_name}
              style={{ borderRadius: "8px" }}
            />
          </div>
          <div className="wishlist-content">
            <div className="wishlist-title">{item.item_name}</div>
            <div className="wishlist-subtitle">{item.item_description}</div>
            <div className="wishlist-date">{formatDate(item.created_at)}</div>
            <div className="wishlist-price">{formatPrice(item.item_price)}</div>
            <div className="wishlist-actions">
              <button onClick={() => handleAddToCart(item.id)}>
                新增到購物車
              </button>
              <button
                className="delete-button"
                onClick={() => handleDelete(item.id)}
              >
                刪除
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
