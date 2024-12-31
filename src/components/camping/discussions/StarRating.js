'use client';
import { FaStar } from 'react-icons/fa';

export default function StarRating({ value, onChange, readOnly = false }) {
  const stars = [1, 2, 3, 4, 5];

  const handleClick = (rating) => {
    if (!readOnly && onChange) {
      onChange(rating);
    }
  };

  return (
    <div className="flex gap-1">
      {stars.map((star) => (
        <FaStar
          key={star}
          className={`text-xl cursor-${readOnly ? 'default' : 'pointer'} ${
            star <= value ? 'text-yellow-400' : 'text-gray-300'
          }`}
          onClick={() => handleClick(star)}
        />
      ))}
    </div>
  );
} 