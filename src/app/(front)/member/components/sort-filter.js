"use client";

import React from "react";
import { FiChevronDown } from "react-icons/fi";

export default function SortAndFilter({
  sortOptions,
  filterOptions,
  onSortChange,
  onFilterChange,
  currentSort = "",
  currentFilter = "",
}) {
  return (
    <div className="sort-and-filter">
      <div className="control-group">
        <div className="select-wrapper">
          <label htmlFor="sort">排序方式</label>
          <div className="custom-select">
            <select
              id="sort"
              onChange={(e) => onSortChange(e.target.value)}
              value={currentSort}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <FiChevronDown className="select-icon" />
          </div>
        </div>

        {filterOptions && (
          <div className="select-wrapper">
            <label htmlFor="filter">篩選類型</label>
            <div className="custom-select">
              <select
                id="filter"
                onChange={(e) => onFilterChange(e.target.value)}
                value={currentFilter}
              >
                {filterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <FiChevronDown className="select-icon" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
