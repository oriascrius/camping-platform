"use client";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Pagination from "./Pagination";
import SortAndFilter from "./sort-filter";
import SearchBar from "./search-bar";

export default function GetCoupons() {
  const { data: session, status } = useSession();
  const [useCoupons, setUseCoupon] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 6; // 每頁顯示的優惠券數量
  const router = useRouter();
  const [sortOption, setSortOption] = useState("end_date");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserCoupons(session.user.id);
    }
  }, [session, sortOption]);

  const fetchUserCoupons = async (userId) => {
    try {
      const response = await fetch(
        `/api/member/user-coupons/${userId}?sortBy=${sortOption}`
      );
      const data = await response.json();
      setUseCoupon(data);
      setTotalPages(Math.ceil(data.length / itemsPerPage));
    } catch (error) {
      console.error("Failed to fetch user coupons:", error);
    }
  };

  const handleCouponClick = (coupon) => {
    router.push({
      pathname: "/purchase",
      query: {
        couponId: coupon.user_coupon_id,
        discount: coupon.discount,
        discountValue: coupon.user_discount_value,
        minPurchase: coupon.user_min_purchase,
        maxDiscount: coupon.user_max_discount,
        endDate: coupon.user_end_date,
      },
    });
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSortChange = (value) => {
    setSortOption(value);
  };

  const paginatedCoupons = useCoupons.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <>
      <div className="coupon-container">
        <SortAndFilter
          sortOptions={[
            { value: "end_date", label: "結束日期" },
            { value: "discount", label: "折扣" },
          ]}
          onSortChange={handleSortChange}
        />
        <SearchBar placeholder="搜尋優惠券..." onSearch={setSearchTerm} />
        {useCoupons.length > 0 ? (
          paginatedCoupons.map((coupon) => (
            <div
              className="coupon-one d-flex align-items-center"
              key={coupon.user_coupon_id}
              onClick={() => handleCouponClick(coupon)}
            >
              <div className="coupon-header">
                {coupon.discount === "percentage"
                  ? `${coupon.user_discount_value}%`
                  : coupon.discount === "fixed"
                  ? `NT ${coupon.user_discount_value}`
                  : coupon.user_discount_value}
              </div>
              <div className="coupon-body">
                <p>優惠券名稱：{coupon.coupon_name}</p>
                <p>最低消費金額：NT {coupon.user_min_purchase}</p>
                <p>最高折抵金額：NT {coupon.user_max_discount}</p>
                <p>
                  有效期限：
                  {coupon.end_date
                    .replace("T", " ")
                    .replace("Z", "")
                    .replace(".000", "")}
                </p>
              </div>
              <div className="coupon-footer">
                <p>優惠券</p>
              </div>
            </div>
          ))
        ) : (
          <p>目前沒有可領取的優惠券</p>
        )}
      </div>
      <div className="pagination-container">
        {useCoupons.length > itemsPerPage && (
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
