'use client';

import React, { useState } from 'react';
import SearchBar from './search-bar';
import SortAndFilter from './sort-filter';
import 'bootstrap-icons/font/bootstrap-icons.css';

export default function WishlistDetails() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('');
  console.log(sortOption);
  const [filterOption, setFilterOption] = useState('');
  console.log(filterOption);

  const handleSearch = (term) => {
    setSearchTerm(term);
    // 在這裡處理搜尋邏輯
  };

  const handleSortChange = (option) => {
    setSortOption(option);
    // 在這裡處理排序邏輯
  };

  const handleFilterChange = (option) => {
    setFilterOption(option);
    // 在這裡處理篩選邏輯
  };

  const wishlistItems = [
    {
      title: '1 人 1 房露營穿骨帳篷 Arpenaz 4.1',
      subtitle: '商品性能',
      date: '新增日期：06/01/2025',
      text: '我們想要設計一款採用 Fresh&Black 技術並可輕鬆搭建的穿骨家庭帳篷。帳篷內部的溫度較低、光線較少，想睡多久就睡多久！',
      price: '$1,884',
    },
    // ...其他願望清單項目...
  ];

  const filteredWishlistItems = wishlistItems.filter((item) =>
    item.title.includes(searchTerm)
  );

  const sortOptions = [
    { value: '', label: '未選擇' },
    { value: 'date', label: '日期' },
    { value: 'popularity', label: '人氣' },
  ];

  const filterOptions = [
    { value: '', label: '未選擇' },
    { value: 'type1', label: '類型1' },
    { value: 'type2', label: '類型2' },
  ];

  return (
    <div className="wishlist-details">
      <h1>願望清單</h1>
      <SortAndFilter
        sortOptions={sortOptions}
        filterOptions={filterOptions}
        onSortChange={handleSortChange}
        onFilterChange={handleFilterChange}
      />
      <SearchBar placeholder="搜尋願望清單..." onSearch={handleSearch} />
      {/* 其他願望清單的內容 */}
      {filteredWishlistItems.map((item, index) => (
        <div className="wishlist-item" key={index}>
          <div className="wishlist-image">
            <img
              src="/images/member/1498.jpg"
              alt={item.title}
              style={{ borderRadius: '8px' }}
            />
          </div>
          <div className="wishlist-content">
            <div className="wishlist-title">{item.title}</div>
            <div className="wishlist-subtitle">{item.subtitle}</div>
            <div className="wishlist-text">{item.text}</div>
            <div className="wishlist-date">{item.date}</div>
            <div className="wishlist-price">{item.price}</div>
            <div className="wishlist-actions">
              <button>新增到購物車</button>
              <button className="delete-button">刪除</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
