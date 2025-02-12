"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import SearchBar from "./search-bar";
import "bootstrap-icons/font/bootstrap-icons.css";
import SortAndFilter from "./sort-filter";
import StarRating from "./star-rating";

// 我的評論
export default function ReviewsDetails() {
  const { data: session, status } = useSession();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("");
  const [filterOption, setFilterOption] = useState("");
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    if (status === "loading") return; // 等待會話加載完成

    if (!session) {
      console.error("No session found");
      return;
    }

    const userId = session.user.id; // 從會話中獲取用戶 ID

    const fetchReviews = async () => {
      try {
        const response = await axios.get(`/api/member/reviews/${userId}`, {
          params: { type: filterOption },
        });
        setReviews(response.data);
      } catch (error) {
        console.error("There was an error fetching the reviews!", error);
      }
    };

    fetchReviews();
  }, [session, status, filterOption]);

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

  const filteredReviews = reviews.filter((review) =>
    review.content.includes(searchTerm)
  );

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

  return (
    <div className="reviews-details">
      <h1>我的評論</h1>
      <SortAndFilter
        sortOptions={sortOptions}
        filterOptions={filterOptions}
        onSortChange={handleSortChange}
        onFilterChange={handleFilterChange}
      />
      <SearchBar placeholder="搜尋評論..." onSearch={handleSearch} />
      {/* 其他評論的內容 */}
      {filteredReviews.map((review, index) => (
        <div className="review-item" key={index}>
          <div className="review-image">
            <img
              src="/images/member/1498.jpg"
              alt={review.title}
              style={{ borderRadius: "8px" }}
            />
            <StarRating initialRating={review.rating} />
            <div className="review-rating"></div>
          </div>
          <div className="review-content">
            <div>
              <div className="review-title">{review.product_name}</div>
              {/* <div className="review-subtitle">{review.item_id}</div> */}
              {review.type === "product" && (
                <>
                  <div className="review-product-description">
                    {review.product_description}
                  </div>
                </>
              )}
              <div className="review-date">{review.created_at}</div>
              <div className="review-text">{review.content}</div>
            </div>
            <div className="review-actions">
              <button>修改評論</button>
            </div>
            <div className="review-type">{review.type}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
