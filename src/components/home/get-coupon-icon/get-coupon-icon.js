"use client";
import Link from "next/link";

const GetCouponIcon = () => {
  return(
    <>
        <Link className="get-coupon-icon" style={{  position: "fixed",right: "14px", bottom: "147px", width: "120px", height: "auto" }} href="/get-coupon">
          <img src="images/index/Group 407.png" />
        </Link>
    </>
  )
}


export default GetCouponIcon;