'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
// import { useRouter } from 'next/router';

export default function Sidebar() {
  const [currentPath, setCurrentPath] = useState('');

  useEffect(() => {
    const { pathname } = window.location;
    setCurrentPath(pathname);
  }, []);

  return (
    <div className="sidebar">
      <ul className="nav flex-column">
        <li className="nav-item">
          <Link
            href="/member/profile"
            className={`nav-link ${
              currentPath === '/member/profile' ? 'active' : ''
            }`}
          >
            登入與安全
          </Link>
        </li>
        <li className="nav-item">
          <Link
            href="/member/purchase-history"
            className={`nav-link ${
              currentPath === '/member/purchase-history' ? 'active' : ''
            }`}
          >
            訂單歷史
          </Link>
        </li>
        <li className="nav-item">
          <Link
            href="/member/reviews"
            className={`nav-link ${
              currentPath === '/member/reviews' ? 'active' : ''
            }`}
          >
            我的評論
          </Link>
        </li>

        <li className="nav-item">
          <Link
            href="/member/wishlist"
            className={`nav-link ${
              currentPath === '/member/wishlist' ? 'active' : ''
            }`}
          >
            願望清單
          </Link>
        </li>

        <li className="nav-item">
          <Link
            href="/member/articles-favorites"
            className={`nav-link ${
              currentPath === '/member/articles-favorites' ? 'active' : ''
            }`}
          >
            我的文章與收藏
          </Link>
        </li>
        <li className="nav-item">
          <Link
            href="/member/coupons"
            className={`nav-link ${
              currentPath === '/member/coupons' ? 'active' : ''
            }`}
          >
            優惠券
          </Link>
        </li>
        <li className="nav-item">
          <Link
            href="/member/customer-service"
            className={`nav-link ${
              currentPath === '/member/customer-service' ? 'active' : ''
            }`}
          >
            客服問答區
          </Link>
        </li>
      </ul>
    </div>
  );
}
