import React from "react";

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="pagination">
      <button onClick={handlePrevious} disabled={currentPage === 1}>
        上一頁
      </button>
      <span>
        第 {currentPage} 頁，共 {totalPages} 頁
      </span>
      <button onClick={handleNext} disabled={currentPage === totalPages}>
        下一頁
      </button>
    </div>
  );
};

export default Pagination;
