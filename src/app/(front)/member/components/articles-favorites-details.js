'use client';

import React, { useState } from 'react';
import SearchBar from './search-bar';
import SortAndFilter from './sort-filter';
import 'bootstrap-icons/font/bootstrap-icons.css';

export default function ArticlesAndFavoritesDetails() {
  const [searchTerm, setSearchTerm] = useState('');
  console.log(searchTerm);
  const [sortOption, setSortOption] = useState('');
  const [filterOption, setFilterOption] = useState('');

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

  const sortOptions = [
    { value: '', label: '未選擇' },
    { value: 'date', label: '日期' },
    { value: 'type', label: '收藏數' },
  ];

  const filterOptions = [
    { value: '', label: '未選擇' },
    { value: 'camping', label: '露營知識' },
    { value: 'hiking', label: '登山知識' },
    // ...其他類型
  ];

  const articles = [
    {
      nickname: '用戶A',
      avatar: '/images/member/avatar1.png',
      title: '露營知識分享',
      content: '這是一篇關於露營知識的文章...',
      date: '2025-06-01',
      type: '露營知識',
    },
    // ...其他文章資料
  ];

  const filteredArticles = articles.filter(
    (article) =>
      (article.title.includes(searchTerm) ||
        article.content.includes(searchTerm) ||
        article.date.includes(searchTerm) ||
        article.type.includes(searchTerm)) &&
      (filterOption === '' || article.type === filterOption)
  );

  return (
    <div className="articles-and-favorites-details">
      <h1>我的文章與收藏</h1>
      <SortAndFilter
        sortOptions={sortOptions}
        filterOptions={filterOptions}
        onSortChange={handleSortChange}
        onFilterChange={handleFilterChange}
      />
      <SearchBar placeholder="搜尋文章或收藏..." onSearch={handleSearch} />
      {filteredArticles.map((article, index) => (
        <div key={index} className="article-card">
          <div className="article-header">
            <img src={article.avatar} alt={article.nickname} />
            <div className="article-nickname">{article.nickname}</div>
          </div>
          <div className="article-body">
            <h2>{article.title}</h2>
            <p>{article.content}</p>
          </div>
          <div className="article-footer">
            <span>{article.date}</span>
            <span>{article.type}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
