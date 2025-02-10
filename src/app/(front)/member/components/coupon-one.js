"use client";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function GetCoupons() {
  const { data: session, status } = useSession();
  const [useCoupons, setuseCoupon] = useState([]);
  const router = useRouter();

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserCoupons(session.user.id);
    }
  }, [session]);

  const fetchUserCoupons = async (userId) => {
    try {
      const response = await fetch(`/api/member/user-coupons/${userId}`);
      const data = await response.json();
      setuseCoupon(data);
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

  return (
    <div className="coupon">
      {useCoupons.length > 0 ? (
        useCoupons.map((coupon) => (
          <div
            className="d-flex align-items-center "
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
                {coupon.expiry_date
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
  );
}
