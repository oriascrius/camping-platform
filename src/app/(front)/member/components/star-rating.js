'use client';
import React, { useState } from 'react';

// 星星子组件
const Star = ({ filled, onClick }) => {
  return (
    <span
      className={`star ${filled ? 'filled' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick();
        }
      }}
    >
      <i className="bi bi-star-fill"></i>
    </span>
  );
};

const StarRating = ({ maxRating = 5, initialRating = 0 }) => {
  const [rating, setRating] = useState(initialRating);

  const handleStarClick = (newRating) => {
    setRating(newRating);
  };

  return (
    <div className="star-rating">
      {Array.from({ length: maxRating }, (_, index) => (
        <Star
          key={index}
          filled={index < rating}
          onClick={() => handleStarClick(index + 1)}
        />
      ))}
    </div>
  );
};

export default StarRating;
