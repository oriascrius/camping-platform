"use client";
import { useEffect, useState } from "react";
import { showCartAlert } from "@/utils/sweetalert";

export default function CouponSelector({
  subtotal = 0,
  selectedCoupon = null,
  setSelectedCoupon = () => {},
  setCouponDiscount = () => {},
}) {
  const [coupons, setCoupons] = useState([]); //可使用優惠卷列表
  //   const [selectedCoupon, setSelectedCoupon] = useState(null); // 儲存當前被選擇的優惠券 移到父層

  //   抓取使用者目前可用的優惠卷
  const fetchCoupons = async () => {
    try {
      const res = await fetch("/api/get-coupon/usersCoupon");
      if (!res.ok) throw new Error("獲取優惠券失敗");

      const data = await res.json();
      //   console.log("獲取優惠券成功:", data.coupons);
      setCoupons(data.coupons || []); // ✅ 只設定 `coupons` 陣列，避免 `undefined`
    } catch (error) {
      console.error("獲取優惠券失敗:", error);
    }
  };

  //當優惠卷被選取時計算折扣值;
  const handleCouponDiscount = () => {
    if (!selectedCoupon) {
      // ✅ 確保 `selectedCoupon` 不為 `null`
      setCouponDiscount(0);
      return;
    }
    if (subtotal >= selectedCoupon.min_purchase) {
      let discount;
      switch (selectedCoupon.discount) {
        case "fixed":
          discount = selectedCoupon.discount_value;
          //   console.log(discount);
          setCouponDiscount(discount);

          break;
        case "percentage":
          discount = Math.floor(
            subtotal * (1 - selectedCoupon.discount_value / 100)
          );
          if (discount < selectedCoupon.max_discount) {
            // console.log(discount);

            setCouponDiscount(discount);
          } else {
            // console.log(selectedCoupon.max_discount);

            setCouponDiscount(selectedCoupon.max_discount);
          }

          break;
        default:
      }
    } else {
      showCartAlert.error(
        "優惠券最低消費滿" + selectedCoupon.min_purchase + "才可使用"
      );
    }
  };

  //當選擇優惠券時，根據 `id` 找出該 `coupon` 的完整資訊
  const handleCouponChange = (event) => {
    const selectedId = event.target.value;
    const coupon = coupons.find((c) => c.id.toString() === selectedId);
    if (coupon) {
      setSelectedCoupon(coupon); // ✅ 設定選中的優惠券資訊
      setCouponDiscount(coupon.discount_value); // ✅ 設定優惠折扣金額
    } else {
      setSelectedCoupon(null);
      setCouponDiscount(0);
    }
  };

  //   頁面載入時抓取
  useEffect(() => {
    fetchCoupons();
  }, []);

  useEffect(() => {
    handleCouponDiscount();
  }, [selectedCoupon]);

  return (
    <section className="coupon">
      <div className="container">
        <div className="main">
          <article className="title">
            <h3>選擇優惠券</h3>
          </article>
          <article className="content mt-3">
            <p className="coupon-label">可使用的優惠券</p>
            <select
              className="coupon-select mt-3"
              onChange={handleCouponChange}
            >
              {coupons.length === 0 ? (
                <option value={null}>無可用優惠券</option>
              ) : (
                <option value={null}>請選擇優惠券</option>
              )}

              {coupons.map((coupon) => (
                <option key={coupon.id} value={coupon.id}>
                  {coupon.name}
                </option>
              ))}
            </select>
          </article>
        </div>
      </div>
    </section>
  );
}
