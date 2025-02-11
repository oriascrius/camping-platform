import Link from 'next/link';
import { useEffect, useState } from 'react';
import PaginationArea from './PaginationArea';

const ForumLi = ({ currentPage, itemsPerPage, category, setCurrentPage }) => {
  const [forumData, setForumData] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentData, setCurrentData] = useState([]);
  const [totalForumDataLength, setTotalForumDataLength] = useState(0); // 新增 state

  useEffect(() => {
    // console.log("ForumLi - useEffect 1 被觸發，currentPage:", currentPage);
    const effectiveCategory = category || '全部';

    const fetchData = async () => {
      try {
        const response = await fetch(`/api/forum/get?category_id=${effectiveCategory}&page=${currentPage}`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();
        setForumData(data.data);
        setTotalPages(data.totalPages);
        setTotalForumDataLength(data.totalCount); // 從 API 取得總長度
        // console.log("ForumLi - API 回傳資料：", data);
      } catch (error) {
        console.error('Error fetching forum data:', error);
      }
    };

    fetchData();
  }, [category, currentPage, setCurrentPage]);

  useEffect(() => {
    // console.log("ForumLi - useEffect 2 被觸發，forumData:", forumData, "currentPage:", currentPage, "itemsPerPage:", itemsPerPage);

    // API 已經幫我們分頁了，不需要再手動 slice
    setCurrentData(forumData);
    // console.log("ForumLi - currentData:", forumData);
  }, [forumData, currentPage, itemsPerPage]);

  return (
    <>
      {currentData.map((forum) => {
        {/* console.log("ForumLi - forum:", forum); */}
        if (!forum) {
          return null;
        }
        const {
          id,
          category_name,
          title_type_name,
          pinned,
          featured,
          thread_image,
          thread_title,
          thread_content,
          user_avatar,
          user_name,
          updated_at
        } = forum;

        const sanitizedContent = thread_content?.replace(/<[^>]*>/g, "") || "";
        {/* const [threadDate, threadTime] = created_at?.split(' ') || ["", ""]; */}
        // 解析時間
        const threadDate = new Date(updated_at).toLocaleDateString();
        const threadTime = new Date(updated_at).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false });


        return (
          <Link
            key={id}
            href={`/forum/thread/${id}`}
            className="forumLi hover d-flex justify-content-between linkStyle"
          >
            <div className="forumLiBox1 d-flex justify-content-between align-items-center">
              <div className="liTitle d-flex flex-wrap justify-content-between">
                <div className="typeBox">
                  <i className="fa-solid fa-tag icon"></i>
                  {category_name}
                </div>
                {pinned === 1 && (
                  <div className="pinned mt-2">
                    <i className="fa-solid fa-arrow-up"></i> 置頂
                  </div>
                )}
                {featured === 1 && (
                  <div className="featured mt-2">
                    <i className="fa-solid fa-star"></i> 精華
                  </div>
                )}
              </div>
              <img src={thread_image} alt={thread_title} />
            </div>
            <div className="forumLiBox2">
              <div className="threadTitle">【{title_type_name}】{thread_title}</div>
              <hr className="threadLine" />
              <div
                className="threadContent"
                dangerouslySetInnerHTML={{ __html: sanitizedContent }}
              />
            </div>
            <div className="forumLiBox3">
              <div className="threadAvatar">
                <img
                  className="avatarAdaptive"
                  src={'/images/member/'+user_avatar}
                  alt={user_name}
                />
              </div>
              <p className="threadUserName">{user_name}</p>
              <p className="threadDate">
                {threadDate}
                <span className="threadTime">{threadTime}</span>
              </p>
            </div>
          </Link>
        );
      })}

      <PaginationArea
        totalPages={totalPages}
        currentPage={currentPage}
        setCurrentPage={(pageNumber) => {
          window.scrollTo(0, 0);
          setCurrentPage(pageNumber);
          // console.log("ForumLi - PaginationArea 的 setCurrentPage 被呼叫，頁碼：", pageNumber);
        }}
      />
    </>
  );
};

export default ForumLi;
