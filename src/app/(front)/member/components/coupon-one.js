"use client";
import { useSession } from "next-auth/react";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Pagination from "./Pagination";
import SortAndFilter from "./sort-filter";
import SearchBar from "./search-bar";
import { ClipLoader } from "react-spinners";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";

export default function GetCoupons() {
  const { data: session, status } = useSession();
  const [useCoupons, setUseCoupon] = useState([]);
  const [filteredCoupons, setFilteredCoupons] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 6;
  const router = useRouter();
  const [sortOption, setSortOption] = useState("start_date");
  const [filterOption, setFilterOption] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // 添加動畫狀態控制
  const [animatingSort, setAnimatingSort] = useState(false);
  const [animatingFilter, setAnimatingFilter] = useState(false);
  const [animatingSearch, setAnimatingSearch] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      Swal.fire({
        icon: "error",
        title: "請先登入",
        text: "請先登入會員",
      });
      router.push("/auth/login");
      return;
    }

    if (session?.user?.id) {
      fetchUserCoupons(session.user.id);
    }
  }, [session, status, sortOption, filterOption]);

  useEffect(() => {
    // 使用 useMemo 來優化過濾邏輯，減少重複計算
    const filtered = useCoupons.filter((coupon) =>
      coupon.coupon_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCoupons(filtered);
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));

    // 如果當前頁面超出總頁數，重置到第一頁
    if (
      currentPage > Math.ceil(filtered.length / itemsPerPage) &&
      filtered.length > 0
    ) {
      setCurrentPage(1);
    }
  }, [searchTerm, useCoupons, itemsPerPage]);

  const fetchUserCoupons = async (userId) => {
    try {
      const response = await fetch(
        `/api/member/user-coupons/${userId}?sortBy=${sortOption}&filterBy=${filterOption}`
      );
      const data = await response.json();
      setUseCoupon(Array.isArray(data) ? data : []);
      setFilteredCoupons(Array.isArray(data) ? data : []);
      setTotalPages(Math.ceil(data.length / itemsPerPage));
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error("Failed to fetch user coupons:", error);
    }
  };

  const handleCouponClick = () => {
    router.push("/products/list");
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // 修改搜尋處理函數，添加動畫效果
  const handleSearch = (term) => {
    setAnimatingSearch(true);
    setSearchTerm(term);
    setCurrentPage(1);

    // 延遲關閉動畫效果
    setTimeout(() => {
      setAnimatingSearch(false);
    }, 300);
  };

  // 修改排序處理函數，添加動畫效果
  const handleSortChange = (value) => {
    setAnimatingSort(true);
    setSortOption(value);
    setCurrentPage(1);

    // 延遲關閉動畫效果
    setTimeout(() => {
      setAnimatingSort(false);
    }, 300);
  };

  // 修改篩選處理函數，添加動畫效果
  const handleFilterChange = (value) => {
    setAnimatingFilter(true);
    setFilterOption(value);
    setCurrentPage(1);

    // 延遲關閉動畫效果
    setTimeout(() => {
      setAnimatingFilter(false);
    }, 300);
  };

  const getLevelName = (levelId) => {
    if (levelId === null) {
      return null;
    }
    switch (levelId) {
      case 1:
        return "新手";
      case 2:
        return "銅牌";
      case 3:
        return "銀牌";
      case 4:
        return "金牌";
      case 5:
        return "鑽石";
      default:
        return "未知等級";
    }
  };

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString("zh-TW", options);
  };

  const paginatedCoupons = filteredCoupons.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const filterOptions = [
    { value: "", label: "全部優惠券" },
    { value: "1", label: "未使用" },
    { value: "0", label: "已使用" },
  ];

  return (
    <>
      <div className="coupon-container">
        <SortAndFilter
          sortOptions={[
            { value: "", label: "--未排序--" },
            { value: "start_date", label: "開始日期" },
            { value: "uc.discount_value", label: "折扣" },
          ]}
          filterOptions={filterOptions}
          onSortChange={handleSortChange}
          onFilterChange={handleFilterChange}
          currentSort={sortOption}
          currentFilter={filterOption}
        />
        <SearchBar placeholder="搜尋優惠券..." onSearch={handleSearch} />

        {/* 添加篩選標籤顯示 */}
        {(sortOption || filterOption || searchTerm) && (
          <div className="active-filters">
            {sortOption && (
              <span className="filter-tag">
                {sortOption === "start_date"
                  ? "開始日期"
                  : sortOption === "uc.discount_value"
                  ? "折扣"
                  : sortOption}
                <button
                  className="tag-remove"
                  onClick={() => handleSortChange("")}
                >
                  ×
                </button>
              </span>
            )}
            {filterOption && (
              <span className="filter-tag">
                {filterOptions.find((opt) => opt.value === filterOption)?.label}{" "}
                <button
                  className="tag-remove"
                  onClick={() => handleFilterChange("")}
                >
                  ×
                </button>
              </span>
            )}
            {searchTerm && (
              <span className="filter-tag">
                "{searchTerm}"{" "}
                <button className="tag-remove" onClick={() => handleSearch("")}>
                  ×
                </button>
              </span>
            )}
          </div>
        )}

        {/* 添加動畫容器類 */}
        <div
          className={`coupon-list ${
            animatingSort || animatingFilter || animatingSearch
              ? "animating"
              : ""
          }`}
        >
          <AnimatePresence mode="popLayout">
            {loading ? (
              Array(6)
                .fill()
                .map((_, index) => (
                  <motion.div
                    key={`skeleton-${index}`}
                    className="coupon-skeleton"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                ))
            ) : filteredCoupons.length > 0 ? (
              paginatedCoupons.map((coupon, index) => (
                <motion.div
                  className="coupon-wrapper"
                  key={coupon.user_coupon_id}
                  layoutId={`coupon-${coupon.user_coupon_id}`}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    transition: {
                      duration: 0.4,
                      delay: index * 0.05,
                    },
                  }}
                  exit={{
                    opacity: 0,
                    y: -30,
                    transition: { duration: 0.3 },
                  }}
                  onClick={handleCouponClick}
                >
                  <div className="coupon-one">
                    <div className="coupon-header">
                      {coupon.discount === "percentage"
                        ? `${coupon.user_discount_value}%`
                        : coupon.discount === "fixed"
                        ? `NT ${coupon.user_discount_value}`
                        : coupon.user_discount_value}
                    </div>
                    <div className="coupon-body">
                      <p>優惠券名稱：{coupon.coupon_name}</p>
                      <p>
                        最低消費金額：NT
                        {Number(coupon.user_min_purchase).toLocaleString(
                          "en-US",
                          {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          }
                        )}
                      </p>
                      <p>
                        最高折抵金額：NT
                        {Number(coupon.user_max_discount).toLocaleString(
                          "en-US",
                          {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          }
                        )}
                      </p>
                      <p>
                        有效期限：
                        {coupon.end_date ? formatDate(coupon.end_date) : "無"}
                      </p>
                      {getLevelName(coupon.level_id) && (
                        <p>會員等級：{getLevelName(coupon.level_id)}</p>
                      )}
                      <p>
                        優惠券狀態：
                        {coupon.coupon_status === 1 ? "未使用" : "已使用"}
                      </p>
                    </div>
                    <div className="coupon-footer">
                      <p>優惠券</p>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div
                className="no-data"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <p>
                  {searchTerm
                    ? "沒有符合搜尋條件的優惠券"
                    : filterOption === "1"
                    ? "無未使用的優惠券"
                    : filterOption === "0"
                    ? "無已使用的優惠券"
                    : "目前沒有領取的優惠券"}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="pagination-container">
        {!loading && filteredCoupons.length > itemsPerPage && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </>
  );
}
