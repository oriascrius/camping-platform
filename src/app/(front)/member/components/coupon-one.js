'use client';

import React from 'react';

const coupon = ({ discount, status, startDate, endDate, footerText }) => {
  return (
    <div className="coupon">
      <div className="coupon-header">{discount}</div>
      <div className="coupon-body">
        <p>{status}</p>
        <p>生效日期：{startDate}</p>
        <p>有效期限：{endDate}</p>
      </div>
      <div className="coupon-footer">
        <p>優惠券</p>
        <p>{footerText}</p>
      </div>
    </div>
  );
};

export default coupon;
