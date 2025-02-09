//session版本

"use client";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

export default function GetCoupons() {
  const { data: session, status } = useSession();
  const [useCoupons, setuseCoupon] = useState([]);

  useEffect(() => {
    if (session?.user?.coupons) {
      setuseCoupon(session.user.coupons);
    }
  }, [session]);

  return (
    <div className="coupon">
      {useCoupons.length > 0 ? (
        useCoupons.map((coupon) => (
          <div className="d-flex align-items-center " key={coupon.id}>
            <div className="coupon-header">
              {coupon.discount === "percentage"
                ? `${coupon.discount_value}%`
                : coupon.discount === "fixed"
                ? `NT ${coupon.discount_value}`
                : coupon.discount_value}
            </div>
            <div className="coupon-body">
              <p>
                有效期限：
                {coupon.expiry_date
                  .replace("T", " ")
                  .replace("Z", "")
                  .replace(".000", "")}{" "}
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

//api版本

// 'use client';
// import { useSession } from 'next-auth/react';
// import { useState, useEffect } from 'react';

// export default function GetCoupons() {
//   const { data: session, status } = useSession();
//   const [useCoupons, setuseCoupon] = useState([]);

//   useEffect(() => {
//     if (session?.user?.id) {
//       fetchUserCoupons(session.user.id);
//     }
//   }, [session]);

//   const fetchUserCoupons = async (userId) => {
//     try {
//       const response = await fetch(`/api/member/user-coupons/${userId}`);
//       const data = await response.json();
//       setuseCoupon(data);
//     } catch (error) {
//       console.error('Failed to fetch user coupons:', error);
//     }
//   };

//   return (
//     <div className="coupon">
//       {useCoupons.length > 0 ? (
//         useCoupons.map((coupon) => (
//           <div className="d-flex align-items-center " key={coupon.id}>
//             <div className="coupon-header">
//               {coupon.discount === 'percentage'
//                 ? `${coupon.discount_value}%`
//                 : coupon.discount === 'fixed'
//                 ? `NT ${coupon.discount_value}`
//                 : coupon.discount_value}
//             </div>
//             <div className="coupon-body">
//               <p>
//                 有效期限：
//                 {coupon.expiry_date
//                   .replace('T', ' ')
//                   .replace('Z', '')
//                   .replace('.000', '')}{' '}
//               </p>
//             </div>
//             <div className="coupon-footer">
//               <p>優惠券</p>
//             </div>
//           </div>
//         ))
//       ) : (
//         <p>目前沒有可領取的優惠券</p>
//       )}
//     </div>
//   );
// }
