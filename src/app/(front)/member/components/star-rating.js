"use client";
import React, { useState, useEffect } from "react";

// 星星子组件
const Star = ({ filled, onClick }) => {
  return (
    <span
      className={`star ${filled ? "filled" : ""}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onClick();
        }
      }}
    >
      <i className="bi bi-star-fill"></i>
    </span>
  );
};

const StarRating = ({ maxRating = 5, initialRating = 0, onRatingChange }) => {
  const [rating, setRating] = useState(initialRating);

  useEffect(() => {
    setRating(initialRating);
  }, [initialRating]);

  const handleStarClick = (newRating) => {
    setRating(newRating);
    if (onRatingChange) {
      onRatingChange(newRating);
    }
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
