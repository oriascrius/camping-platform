'use client';

import React from 'react';

export default function SearchBar({ placeholder, onSearch }) {
  return (
    <div className="search-bar">
      <input
        type="text"
        className="search-input"
        placeholder={placeholder}
        onChange={(e) => onSearch(e.target.value)}
      />
      <button className="search-button">
        <i className="bi bi-search"></i>
      </button>
    </div>
  );
}
