"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import SearchBar from "./search-bar";
import "bootstrap-icons/font/bootstrap-icons.css";
import SortAndFilter from "./sort-filter";
import StarRating from "./star-rating";
import Swal from "sweetalert2";
import Pagination from "./Pagination";

// 我的評論
export default function ReviewsDetails() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("");
  const [filterOption, setFilterOption] = useState("");
  const [reviews, setReviews] = useState([]);
  const [editingReview, setEditingReview] = useState(null);
  const [newContent, setNewContent] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 3; // 每頁顯示的評論數量

  useEffect(() => {
    if (status === "loading") return; // 等待會話加載完成

    if (!session) {
      Swal.fire({
        icon: "error",
        title: "請先登入",
        text: "請先登入會員",
      });
      // console.error("No session found");
      router.push("/auth/login");
      return;
    }

    const userId = session.user.id; // 從會話中獲取用戶 ID

    const fetchReviews = async () => {
      try {
        const response = await axios.get(`/api/member/reviews/${userId}`, {
          params: { type: filterOption },
        });
        setReviews(response.data);
        setTotalPages(Math.ceil(response.data.length / itemsPerPage));
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

  const handleRatingChange = async (itemId, newRating) => {
    try {
      await axios.post(`/api/member/reviews/${session.user.id}`, {
        itemId,
        rating: newRating,
        content: reviews.find((review) => review.item_id === itemId).content,
      });
      setReviews((prevReviews) =>
        prevReviews.map((review) =>
          review.item_id === itemId ? { ...review, rating: newRating } : review
        )
      );
    } catch (error) {
      console.error("There was an error updating the rating!", error);
    }
  };

  const handleEditReview = (review) => {
    setEditingReview(review);
    setNewContent(review.content);
  };

  const handleSaveReview = async () => {
    try {
      await axios.post(`/api/member/reviews/${session.user.id}`, {
        itemId: editingReview.item_id,
        rating: editingReview.rating,
        content: newContent,
      });
      setReviews((prevReviews) =>
        prevReviews.map((review) =>
          review.item_id === editingReview.item_id
            ? { ...review, content: newContent }
            : review
        )
      );
      setEditingReview(null);
      setNewContent("");
    } catch (error) {
      console.error("There was an error updating the review!", error);
    }
  };

  const handleCancelEdit = () => {
    setEditingReview(null);
    setNewContent("");
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const filteredReviews = reviews.filter((review) =>
    review.content.includes(searchTerm)
  );

  const paginatedReviews = filteredReviews.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
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
      {paginatedReviews.map((review, index) => (
        <div className="review-item" key={index}>
          <div className="review-image">
            <img
              src="/images/index/image (1).jpg"
              alt={review.title}
              style={{ borderRadius: "8px" }}
            />
            <StarRating
              initialRating={review.rating}
              onRatingChange={(newRating) =>
                handleRatingChange(review.item_id, newRating)
              }
            />
            <div className="review-rating"></div>
          </div>
          <div className="review-content">
            <div>
              <div className="review-title">{review.product_name}</div>
              <div className="review-date">{review.type}</div>
              {/* <div className="review-subtitle">{review.item_id}</div> */}
              {review.type === "product" && (
                <>
                  <div className="review-product-description">
                    {review.product_description}
                  </div>
                </>
              )}
              <div className="review-date">{review.created_at}</div>

              {editingReview && editingReview.item_id === review.item_id ? (
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  style={{ width: "100%" }}
                />
              ) : (
                <span
                  className="review-text"
                  dangerouslySetInnerHTML={{ __html: review.content }}
                />
              )}
            </div>

            <div className="review-actions">
              {editingReview && editingReview.item_id === review.item_id ? (
                <div className="edit-actions">
                  <button onClick={handleSaveReview}>保存</button>
                  <button onClick={handleCancelEdit}>取消</button>
                </div>
              ) : (
                <button onClick={() => handleEditReview(review)}>
                  修改評論
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
      <div className="pagination-container">
        {reviews.length > itemsPerPage && (
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
