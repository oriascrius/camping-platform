import { useState, useEffect } from 'react';
import ForumLi from './ForumLi';
import ForumList from './ForumList';

const Forum = () => {
  const [category, setCategory] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    console.log(`🟡 Forum - currentPage 更新為: ${currentPage}`); // 監聽 currentPage 變化
  }, [currentPage]);

  // 修改 setCategory，讓分類變更時重設 currentPage
  const handleSetCategory = (newCategory) => {
    console.log(`Forum - 切換分類至: ${newCategory}，自動重置到第 1 頁`);
    setCategory(newCategory);
    setCurrentPage(1); // 每次切換分類時，回到第一頁
  };

  const handleSetCurrentPage = (page) => {
    setCurrentPage(page);
    console.log(`Forum - handleSetCurrentPage 被呼叫，頁碼為：${page}`);
  };

  return (
    <>
      <ForumList setCategory={handleSetCategory} />
      <ForumLi
        key={`${category}-${currentPage}`} // 重新渲染時強制刷新
        category={category}
        currentPage={currentPage}
        itemsPerPage={10}
        setCurrentPage={handleSetCurrentPage}
      />
    </>
  );
};

export default Forum;
