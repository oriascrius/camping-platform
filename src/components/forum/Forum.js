import React, { useState } from 'react'
import { forumData } from '@/data/forum/data' // 假設 forumData 是你的資料來源
import ForumLi from './ForumLi' // 引入 ForumLi 元件
import PaginationArea from './PaginationArea' // 引入 PaginationArea 元件

const Forum = () => {
  const itemsPerPage = 10 // 每頁顯示 10 筆資料
  const totalItems = forumData.length // 總資料數
  const totalPages = Math.ceil(totalItems / itemsPerPage) // 計算總頁數

  const [currentPage, setCurrentPage] = useState(1) // 初始頁數為第 1 頁

  return (
    <>
      {/* 顯示當前頁的資料 */}
      <ForumLi currentPage={currentPage} itemsPerPage={itemsPerPage} />

      {/* 如果總頁數大於 1，顯示分頁元件 */}
      {totalPages > 1 && (
        <PaginationArea
          totalPages={totalPages} // 總頁數
          currentPage={currentPage} // 當前頁數
          setCurrentPage={setCurrentPage} // 更新當前頁數
        />
      )}
    </>
  )
}

export default Forum
