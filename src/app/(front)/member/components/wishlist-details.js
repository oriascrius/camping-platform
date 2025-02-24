"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import SearchBar from "./search-bar";
import SortAndFilter from "./sort-filter";
import "bootstrap-icons/font/bootstrap-icons.css";
import Swal from "sweetalert2";
import { useProductCart } from "@/hooks/useProductCart"; // 引入 useProductCart 鉤子
import Pagination from "./Pagination";
import Link from "next/link";
import { ClipLoader } from "react-spinners"; // 引入 react-spinners
import { motion, AnimatePresence } from "framer-motion"; // 引入 framer-motion

export default function WishlistDetails() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("");
  const [filterOption, setFilterOption] = useState("");
  const [wishlistItems, setWishlistItems] = useState([]);
  const { addToCart } = useProductCart(); // 使用 useProductCart 鉤子
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true); // 加載狀態
  const itemsPerPage = 3; // 每頁顯示的願望清單項目數量

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
      .get(`/api/member/wishlist/${userId}`) // 在 API 請求中包含 userId
      .then((response) => {
        setWishlistItems(response.data);
        setLoading(false); // 數據加載完成
      })
      .catch((error) => {
        setLoading(false); // 數據加載完成
        if (error.response && error.response.status === 404) {
          console.log("沒有願望");
        } else {
          console.error(
            "There was an error fetching the wishlist items!",
            error
          );
        }
      });
  }, [session, status]);

  const handleSearch = (term) => {
    setSearchTerm(term);
    // 在這裡處理搜尋邏輯
  };

  const handleSortChange = (option) => {
    setSortOption(option);
    // 在這裡處理排序邏輯
    const sortedItems = [...wishlistItems].sort((a, b) => {
      if (option === "date") {
        return new Date(a.created_at) - new Date(b.created_at);
      } else if (option === "price") {
        return a.item_price - b.item_price;
      }
      return 0;
    });
    setWishlistItems(sortedItems);
  };

  const handleFilterChange = (option) => {
    setFilterOption(option);
  };

  const handleAddToCart = async (item) => {
    if (item.type === "camp") {
      try {
        const response = await axios.post("/api/member/activity-cart", {
          user_id: session.user.id,
          activity_id: item.item_id,
          option_id: item.option_id, // 假設有 option_id 屬性
          quantity: 1, // 預設數量為 1
          start_date: item.start_date, // 假設有 start_date 屬性
          end_date: item.end_date, // 假設有 end_date 屬性
        });
        if (response.status === 200) {
          Swal.fire({
            icon: "success",
            title: "已加入購物車",
            text: "活動已成功加入購物車",
          });
        }
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "加入購物車失敗",
          text: "無法加入活動到購物車",
        });
      }
    } else {
      try {
        const response = await axios.post("/api/product-cart", {
          productId: item.item_id,
          quantity: 1, // 預設數量為 1
        });
        if (response.status === 200) {
          Swal.fire({
            icon: "success",
            title: "已加入購物車",
            text: "商品已成功加入購物車",
          });
        }
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "加入購物車失敗",
          text: "無法加入商品到購物車",
        });
      }
    }
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

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const filteredWishlistItems = wishlistItems
    .filter((item) =>
      item.item_name ? item.item_name.includes(searchTerm) : false
    )
    .filter((item) => (filterOption ? item.type === filterOption : true));

  const paginatedWishlistItems = filteredWishlistItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setTotalPages(Math.ceil(filteredWishlistItems.length / itemsPerPage));
  }, [filteredWishlistItems.length]);

  const sortOptions = [
    { value: "", label: "未選擇" },
    { value: "date", label: "新增日期" },
    { value: "price", label: "價格" },
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
    if (typeof price === "object" && price !== null) {
      return `${price.min.toLocaleString("zh-TW")} ~ ${price.max.toLocaleString(
        "zh-TW"
      )}`;
    }
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
      <AnimatePresence>
        {loading ? (
          <div className="loading">
            <ClipLoader size={50} color={"#5b4034"} loading={loading} />
          </div>
        ) : paginatedWishlistItems.length === 0 ? (
          <div className="no-data">沒有加入願望的商品</div>
        ) : (
          paginatedWishlistItems.map((item, index) => (
            <motion.div
              className="wishlist-item"
              key={index}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }} // 修改 exit 動畫
              transition={{ duration: 0.5 }}
            >
              <div className="wishlist-image">
                {item.item_image ? (
                  <img
                    src={
                      item.type === "camp"
                        ? `/uploads/activities/${item.item_image}`
                        : `/images/products/${item.item_image}`
                    }
                    alt={item.item_name}
                    style={{ borderRadius: "8px" }}
                  />
                ) : (
                  <img
                    src="/images/index/image (2).jpg"
                    alt={item.item_name}
                    style={{ borderRadius: "8px" }}
                  />
                )}
              </div>
              <div className="wishlist-content">
                <Link href={`/products/${item.item_id}`} key={index}>
                  <div className="wishlist-title">{item.item_name}</div>
                </Link>
                <div className="wishlist-subtitle">{item.item_description}</div>
                <div className="wishlist-date">
                  <p>新增日期：{formatDate(item.created_at)}</p>
                </div>
                <div className="wishlist-price">
                  ${formatPrice(item.item_price)}
                </div>
                <div className="wishlist-actions">
                  <button onClick={() => handleAddToCart(item)}>
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
            </motion.div>
          ))
        )}
      </AnimatePresence>
      <div className="pagination-container">
        {wishlistItems.length > itemsPerPage && (
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
