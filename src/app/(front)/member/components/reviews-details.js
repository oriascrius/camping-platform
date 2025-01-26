'use client';

import React, { useState } from 'react';
import SearchBar from './search-bar';
import 'bootstrap-icons/font/bootstrap-icons.css';
import SortAndFilter from './sort-filter';
import StarRating from './star-rating';

// 我的評論
export default function ReviewsDetails() {
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

  const reviews = [
    {
      title: '南投埔里 LOLO農場-休閒露營園區',
      subtitle: '不會再去的營區（雷）',
      date: '新增日期：2023年10月02日',
      text: '因為連日地震和大雨，我很感謝營主可以讓我們延期，只是到了現場後，營主的電話完全打不通（大概打了10通有），營本部也沒人，溜滑梯區雜草叢生完全沒整理，也沒辦法下去玩，洗澡水溫很難調整，不是超燙就是超冷，冰箱也不夠冷，對了，說明中的咖啡廳早就沒營業了。雨棚區完全沒有景觀，我只能說這間是絕對不會再訪的營區，若營主尚有心做露營，請好好整理經營，謝謝',
    },
    // ...其他評論...
  ];

  const filteredReviews = reviews.filter((review) =>
    review.title.includes(searchTerm)
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
    <div className="reviews-details">
      <h1>我的評論</h1>
      <SortAndFilter
        sortOptions={sortOptions}
        filterOptions={filterOptions}
        onSortChange={handleSortChange}
        onFilterChange={handleFilterChange}
      />
      <SearchBar placeholder="搜尋評論..." onSearch={handleSearch} />
      {/* 其他評論的內容 */}
      {filteredReviews.map((review, index) => (
        <div className="review-item" key={index}>
          <div className="review-image">
            <img
              src="/images/member/1498.jpg"
              alt={review.title}
              style={{ borderRadius: '8px' }}
            />
            <StarRating /> <div className="review-rating"></div>
          </div>
          <div className="review-content">
            <div>
              <div className="review-title">{review.title}</div>
              <div className="review-subtitle">{review.subtitle}</div>
              <div className="review-date">{review.date}</div>
              <div className="review-text">{review.text}</div>
            </div>
            <div className="review-actions">
              <button>修改評論</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
