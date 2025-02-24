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
import Link from "next/link";
import { ClipLoader } from "react-spinners"; // 引入 react-spinners
import { motion, AnimatePresence } from "framer-motion"; // 引入 framer-motion

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
  const [loading, setLoading] = useState(true); // 加載狀態
  const itemsPerPage = 3; // 每頁顯示的評論數量

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

    const fetchReviews = async () => {
      try {
        const response = await axios.get(`/api/member/reviews/${userId}`, {
          params: { type: filterOption, sort: sortOption },
        });
        setReviews(response.data);
        setTotalPages(Math.ceil(response.data.length / itemsPerPage));
        setLoading(false); // 數據加載完成
      } catch (error) {
        setLoading(false); // 數據加載完成
        if (error.response && error.response.status === 404) {
          console.log("沒有評論");
        } else {
          console.error("There was an error fetching the reviews!", error);
        }
      }
    };

    fetchReviews();
  }, [session, status, filterOption, sortOption]);

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
    { value: "rating", label: "評分" },
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
      <AnimatePresence>
        {loading ? (
          <div className="loading">
            <ClipLoader size={50} color={"#5b4034"} loading={loading} />
          </div>
        ) : paginatedReviews.length === 0 ? (
          <div className="no-data">
            <p>沒有評價過商品</p>
          </div>
        ) : (
          paginatedReviews.map((review, index) => (
            <motion.div
              className="review-item"
              key={index}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5 }}
            >
              <div className="review-image">
                {review.item_image ? (
                  <img
                    src={
                      review.type === "camp"
                        ? `/uploads/activities/${review.item_image}`
                        : `/images/products/${review.item_image}`
                    }
                    alt={review.item_name}
                    style={{ borderRadius: "8px" }}
                  />
                ) : (
                  <img
                    src="/uploads/activities/105_674d1feb03202.jpg"
                    alt="預設圖片"
                    style={{ borderRadius: "8px" }}
                  />
                )}
                <StarRating
                  initialRating={review.rating}
                  onRatingChange={(newRating) =>
                    handleRatingChange(review.item_id, newRating)
                  }
                  size={38}
                />
                <div className="review-rating"></div>
              </div>
              <div className="review-content">
                <div>
                  <div className="review-title">
                    <Link
                      href={
                        review.type === "camp"
                          ? `/activities/${review.item_id}`
                          : `/products/${review.item_id}`
                      }
                    >
                      {review.item_name}
                    </Link>
                  </div>
                  <div className="review-date">
                    {review.type === "camp"
                      ? "分類：露營"
                      : review.type === "product"
                      ? "分類：商品"
                      : review.type}
                  </div>
                  <div className="review-product-description">
                    {review.item_description}
                  </div>
                  <div className="review-date">
                    {new Date(review.created_at).toLocaleDateString("zh-TW", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>

                  {editingReview && editingReview.item_id === review.item_id ? (
                    <textarea
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      style={{ width: "100%" }}
                      className="form-control d-inline-flex focus-ring text-decoration-none"
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
            </motion.div>
          ))
        )}
      </AnimatePresence>
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
