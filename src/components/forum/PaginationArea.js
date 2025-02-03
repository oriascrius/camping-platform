const PaginationArea = ({ totalPages, currentPage, setCurrentPage }) => {
  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber)
    }
  }

  const generatePageNumbers = () => {
    const maxVisiblePages = 5 // 顯示最多 5 頁
    let startPage = Math.max(1, currentPage - 2)
    let endPage = Math.min(totalPages, currentPage + 2)

    // 確保最多顯示 5 頁
    if (endPage - startPage + 1 < maxVisiblePages) {
      if (startPage === 1) {
        endPage = Math.min(totalPages, startPage + 4)
      } else {
        startPage = Math.max(1, endPage - 4)
      }
    }

    const pages = []
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    return pages
  }

  const pageNumbers = generatePageNumbers()

  return (
    <div className="paginationArea">
      <div className="pagination d-flex justify-content-between">
        <button
          className="pageBtn"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <i className="fa-solid fa-caret-left"></i>
        </button>

        {pageNumbers.map((pageNumber) => (
          <button
            key={pageNumber}
            className={`pageBtn ${pageNumber === currentPage ? 'active' : ''}`}
            onClick={() => handlePageChange(pageNumber)}
            href="#forumListTop"
          >
            {pageNumber}
          </button>
        ))}

        <button
          className="pageBtn"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <i className="fa-solid fa-caret-right"></i>
        </button>
      </div>
    </div>
  )
}

export default PaginationArea
