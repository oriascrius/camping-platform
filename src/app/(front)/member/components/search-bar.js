"use client";

import React, { useState } from "react";
import { FiSearch, FiX } from "react-icons/fi"; // 使用更现代的图标库

export default function SearchBar({ placeholder, onSearch }) {
  const [searchValue, setSearchValue] = useState("");

  const handleClear = () => {
    setSearchValue("");
    onSearch("");
  };

  return (
    <div className="member-search-bar">
      <div className="search-container">
        <input
          type="text"
          className="member-search-input"
          placeholder={placeholder}
          value={searchValue}
          onChange={(e) => {
            setSearchValue(e.target.value);
            onSearch(e.target.value);
          }}
        />
        <div className="icon-container">
          {searchValue ? (
            <button className="clear-button" onClick={handleClear}>
              <FiX />
            </button>
          ) : (
            <FiSearch className="search-icon" />
          )}
        </div>
      </div>
    </div>
  );
}
