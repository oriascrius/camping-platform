'use client';

import React from 'react';
import Sidebar from '../components/sidebar';
import '../styles/member.scss';
import CustomerService from '../components/customer-service';

export default function ProfilePage() {
  return (
    <div className="content container">
      <Sidebar />
      <div className="main-content">
        <CustomerService />
        {/* 其他個人資料的內容 */}
      </div>
    </div>
  );
}
