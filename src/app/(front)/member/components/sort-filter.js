"use client";

import React from "react";

export default function SortAndFilter({
  sortOptions,
  filterOptions,
  onSortChange,
  onFilterChange,
}) {
  return (
    <div className="sort-and-filter">
      <div className="sort">
        <label htmlFor="sort">排序方式:</label>
        <select id="sort" onChange={(e) => onSortChange(e.target.value)}>
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      {filterOptions && (
        <div className="filter">
          <label htmlFor="filter">類型:</label>
          <select id="filter" onChange={(e) => onFilterChange(e.target.value)}>
            {filterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
