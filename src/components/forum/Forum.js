'use client'
import { useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import ForumLi from './ForumLi'
import ForumList from './ForumList'

const Forum = () => {
  const searchParams = useSearchParams()
  // 新增一個狀態來判斷目前載入的清單類型
  // 預設可以是 'all'，表示一般的所有文章
  // 其他值例如 'post' 表示發文清單， 'favorite' 表示收藏清單
  // 透過 URL 讀取 list 參數，預設為 'all'
  const apiType = searchParams.get('list') || 'all'
  // console.log('目前的 list 參數:', apiType)

  const [category, setCategory] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  // const [tabCategory, setTabCategory] = useState(0); // 建立一個狀態來保存分類

  useEffect(() => {
    // 當 currentPage 更新時可以觸發一些 side effect
    // console.log(`🟡 Forum - currentPage 更新為: ${currentPage}`); // 監聽 currentPage 變化
  }, [currentPage])

  // 修改 setCategory，讓分類變更時重設 currentPage
  const handleSetCategory = (newCategory) => {
    // console.log(`Forum - 切換分類至: ${newCategory}，自動重置到第 1 頁`);
    setCategory(newCategory)
    setCurrentPage(1) // 每次切換分類時，回到第一頁
    // 當切換分類時，也可以考慮重設 apiType 為一般清單
    // setApiType('all')
  }

  const handleSetCurrentPage = (page) => {
    setCurrentPage(page)
    // console.log(`Forum - handleSetCurrentPage 被呼叫，頁碼為：${page}`);
  }

  return (
    <>
      {/* ForumList 負責顯示分類選單，更新父層的 category */}
      <ForumList setCategory={handleSetCategory}/>
      {/* ForumLi 根據傳入的 category、分頁與 apiType 來呼叫對應的 API */}
      <ForumLi
        key={`${category}-${currentPage}-${apiType}`} // 依 apiType 更新時也強制刷新
        category={category}
        currentPage={currentPage}
        itemsPerPage={10}
        setCurrentPage={handleSetCurrentPage}
        apiType={apiType} // 傳入目前的 API 類型，讓 ForumLi 根據這個參數決定調用哪個 API
      />
    </>
  )
}

export default Forum
