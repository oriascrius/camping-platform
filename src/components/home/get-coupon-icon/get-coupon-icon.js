"use client";
import Link from "next/link";
import Image from "next/image";
const GetCouponIcon = () => {
  return(
    <>
        <Link className="get-coupon-icon" style={{  position: "fixed",right: "14px", bottom: "147px", width: "120px", height: "auto" }} href="/get-coupon">
          <Image src="/images/index/Group 407.png" width={120} height={120} alt="get-coupon-icon"  />
        </Link>
    </>
  )
}


export default GetCouponIcon;