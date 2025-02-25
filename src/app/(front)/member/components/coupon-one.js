"use client";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Pagination from "./Pagination";
import SortAndFilter from "./sort-filter";
import SearchBar from "./search-bar";
import { ClipLoader } from "react-spinners"; // 引入 react-spinners
import { motion, AnimatePresence } from "framer-motion"; // 引入 framer-motion
import Swal from "sweetalert2"; // 引入 sweetalert2

export default function GetCoupons() {
  const { data: session, status } = useSession();
  const [useCoupons, setUseCoupon] = useState([]);
  const [filteredCoupons, setFilteredCoupons] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 6; // 每頁顯示的優惠券數量
  const router = useRouter();
  const [sortOption, setSortOption] = useState("start_date");
  const [filterOption, setFilterOption] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true); // 加載狀態

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

    if (session?.user?.id) {
      fetchUserCoupons(session.user.id);
    }
  }, [session, status, sortOption, filterOption]);

  useEffect(() => {
    const filtered = useCoupons.filter((coupon) =>
      coupon.coupon_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCoupons(filtered);
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
    setCurrentPage(1);
  }, [searchTerm, useCoupons]);

  const fetchUserCoupons = async (userId) => {
    try {
      const response = await fetch(
        `/api/member/user-coupons/${userId}?sortBy=${sortOption}&filterBy=${filterOption}`
      );
      const data = await response.json();
      setUseCoupon(Array.isArray(data) ? data : []);
      setFilteredCoupons(Array.isArray(data) ? data : []);
      setTotalPages(Math.ceil(data.length / itemsPerPage));
      setLoading(false); // 數據加載完成
    } catch (error) {
      setLoading(false); // 數據加載完成
      console.error("Failed to fetch user coupons:", error);
    }
  };

  const handleCouponClick = () => {
    router.push("/products/list");
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSortChange = (value) => {
    setSortOption(value);
  };

  const handleFilterChange = (value) => {
    setFilterOption(value);
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
    // ...其他類型
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
        />
        <SearchBar placeholder="搜尋優惠券..." onSearch={setSearchTerm} />
        <div className="coupon-list">
          <AnimatePresence>
            {loading ? (
              Array(6)
                .fill()
                .map((_, index) => (
                  <motion.div
                    key={index}
                    className="coupon-skeleton"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                ))
            ) : filteredCoupons.length > 0 ? (
              paginatedCoupons.map((coupon) => (
                <motion.div
                  className="coupon-wrapper"
                  key={coupon.user_coupon_id}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -50 }}
                  transition={{ duration: 0.5 }}
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
              <div className="no-data">
                <p>
                  {searchTerm
                    ? "沒有符合搜尋條件的優惠券"
                    : filterOption === "1"
                    ? "無未使用的優惠券"
                    : filterOption === "0"
                    ? "無已使用的優惠券"
                    : "目前沒有領取的優惠券"}
                </p>
              </div>
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
