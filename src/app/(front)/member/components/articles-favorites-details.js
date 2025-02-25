"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import SearchBar from "./search-bar";
import SortAndFilter from "./sort-filter";
import Pagination from "./Pagination";
import { useRouter } from "next/navigation";
import "bootstrap-icons/font/bootstrap-icons.css";
import { useSession } from "next-auth/react";
import Swal from "sweetalert2";
import { ClipLoader } from "react-spinners"; // 引入 react-spinners
import "../styles/components/_pagination.scss"; // 新增這行
import { motion } from "framer-motion";
export default function ArticlesAndFavoritesDetails() {
  const { data: session, status } = useSession();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("");
  const [filterOption, setFilterOption] = useState(""); // 修改這行
  const [currentPage, setCurrentPage] = useState(1); // 新增這行
  const [itemsPerPage] = useState(5); // 新增這行
  const router = useRouter();

  const [articles, setArticles] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [editingArticleId, setEditingArticleId] = useState(null);
  const [editedContent, setEditedContent] = useState("");
  const [expandedItems, setExpandedItems] = useState({}); // 新增這行
  const [loading, setLoading] = useState(true); // 加載狀態

  useEffect(() => {
    if (status === "loading") return; // 等待會話加載完成

    if (!session) {
      Swal.fire({
        icon: "error",
        title: "請先登入",
        text: "請先登入會員",
      });
      router.push("/auth/login");
      return;
    }

    const userId = session.user.id; // 從會話中獲取用戶 ID

    axios
      .get(`/api/member/articles/${userId}`) // 在 API 請求中包含 userId
      .then((response) => {
        setArticles(response.data);
        setTimeout(() => setLoading(false), 2000); // 延遲2秒後設置加載狀態為false
      })
      .catch((error) => {
        setTimeout(() => setLoading(false), 1000); // 延遲2秒後設置加載狀態為false
        if (error.response && error.response.status === 404) {
          console.log("沒有文章");
        } else {
          console.error("There was an error fetching the articles!", error);
        }
      });

    axios
      .get(`/api/member/my-favorites/${userId}`) // 獲取用戶的收藏文章
      .then((response) => {
        setFavorites(response.data);
      })
      .catch((error) => {
        if (error.response && error.response.status === 404) {
          console.log("沒有收藏文章");
        } else {
          console.error("There was an error fetching the favorites!", error);
        }
      });
  }, [session, status]);

  const handleSearch = (term) => {
    setSearchTerm(term);
    // 在這裡處理搜尋邏輯
  };

  const handleSortChange = (option) => {
    setSortOption(option);
    // 在這裡處理排序邏輯
  };

  const handleFilterChange = (option) => {
    setFilterOption(option);
    setCurrentPage(1); // 當篩選條件改變時，重置到第一頁
  };

  const handleEditClick = (article) => {
    setEditingArticleId(article.id);
    // 將HTML轉換為純文本
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = article.content;
    setEditedContent(tempDiv.textContent);

    // 滾動到文章位置
    const articleElement = document.getElementById(`article-${article.id}`);
    if (articleElement) {
      const offset = 100; // 設置偏移量
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = articleElement.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  const handleSaveClick = (articleId) => {
    // 將純文本轉換為安全HTML
    const sanitizedHTML = editedContent
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br/>");
    axios
      .put(`/api/member/articles/${session.user.id}`, {
        id: articleId,
        content: sanitizedHTML,
      })
      .then((response) => {
        setArticles((prevArticles) =>
          prevArticles.map((article) =>
            article.id === articleId
              ? { ...article, content: sanitizedHTML }
              : article
          )
        );
        setEditingArticleId(null);
        setEditedContent("");
      })
      .catch((error) => {
        console.error("There was an error updating the article!", error);
      });
  };

  const handleFavoriteClick = (articleId) => {
    const isFavorite = favorites.some((fav) => fav.id === articleId);
    if (isFavorite) {
      axios
        .delete(`/api/member/my-favorites/${session.user.id}/${articleId}`)
        .then(() => {
          setFavorites((prevFavorites) =>
            prevFavorites.filter((fav) => fav.id !== articleId)
          );
        })
        .catch((error) => {
          console.error("There was an error removing the favorite!", error);
        });
    } else {
      axios
        .post(`/api/member/my-favorites/${session.user.id}`, { articleId })
        .then(() => {
          setFavorites((prevFavorites) => [
            ...prevFavorites,
            { id: articleId },
          ]);
        })
        .catch((error) => {
          console.error("There was an error adding the favorite!", error);
        });
    }
  };

  const filteredArticles = articles.filter(
    (article) =>
      (article.title?.includes(searchTerm) ||
        article.content?.includes(searchTerm) ||
        article.name?.includes(searchTerm) || // 修改這裡
        article.article_category_name?.includes(searchTerm) ||
        article.date?.includes(searchTerm) ||
        article.type?.includes(searchTerm)) &&
      (filterOption === "articles" || filterOption === "")
  );

  const filteredFavorites = favorites.filter(
    (article) =>
      (article.title?.includes(searchTerm) ||
        article.content?.includes(searchTerm) ||
        article.name?.includes(searchTerm) || // 修改這裡
        article.article_category_name?.includes(searchTerm) ||
        article.date?.includes(searchTerm) ||
        article.type?.includes(searchTerm)) &&
      (filterOption === "favorites" || filterOption === "")
  );

  // 分頁邏輯
  const combinedItems =
    filterOption === "favorites"
      ? filteredFavorites
      : filterOption === "articles"
      ? filteredArticles
      : [...filteredArticles, ...filteredFavorites].sort((a, b) => {
          if (sortOption === "date") {
            return new Date(b.created_at) - new Date(a.created_at);
          } else if (sortOption === "views") {
            return b.views - a.views;
          } else if (sortOption === "article_like") {
            return b.article_like - a.article_like;
          }
          return 0;
        });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = combinedItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(combinedItems.length / itemsPerPage);

  const sortOptions = [
    { value: "", label: "未選擇" },
    { value: "date", label: "日期" },
    { value: "views", label: "瀏覽數" },
    { value: "article_like", label: "收藏數" },
  ];

  const filterOptions = [
    { value: "", label: "全部文章" },
    { value: "articles", label: "我的文章" },
    { value: "favorites", label: "我的收藏" },
    // ...其他類型
  ];

  // 新增工具函数
  const truncateHTML = (html, maxLength) => {
    const div = document.createElement("div");
    div.innerHTML = html;
    const text = div.textContent || div.innerText || "";
    return text.slice(0, maxLength) + (text.length > maxLength ? "..." : "");
  };

  const toggleExpand = (id) => {
    setExpandedItems((prevExpandedItems) => ({
      ...prevExpandedItems,
      [id]: !prevExpandedItems[id],
    }));
  };

  return (
    <div className="articles-and-favorites-details">
      <h1>我的文章與收藏</h1>
      <SortAndFilter
        sortOptions={sortOptions}
        filterOptions={filterOptions}
        onSortChange={handleSortChange}
        onFilterChange={handleFilterChange}
      />
      <SearchBar placeholder="搜尋文章或收藏..." onSearch={handleSearch} />
      {loading ? (
        Array(itemsPerPage)
          .fill()
          .map((_, index) => (
            <motion.div
              key={index}
              className="lm-skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          ))
      ) : (
        <>
          {currentItems.length === 0 ? (
            searchTerm ? (
              <div className="no-data">
                <p>沒有符合搜尋條件的文章</p>
              </div>
            ) : filterOption === "articles" ? (
              <div className="no-data">
                <p>沒有發文紀錄</p>
              </div>
            ) : filterOption === "favorites" ? (
              <div className="no-data">
                <p>沒有收藏的文章</p>
              </div>
            ) : (
              <div className="no-data">
                <p>沒有文章與收藏，去觀看文章或分享心得吧</p>
              </div>
            )
          ) : (
            currentItems.map((item, index) => (
              <motion.div
                key={index}
                id={`article-${item.id}`} // 添加這行
                className="article-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className="article-header">
                  <img
                    src={`/images/member/${item.avatar}`}
                    alt={item.name} // 修改這裡
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/images/default-avatar.png";
                    }}
                  />
                  <div className="article-nickname">{item.name}</div>
                  <div className="article-meta">
                    <span className="me-2">瀏覽數: {item.views}</span>
                    {item.created_at !== item.updated_at ? (
                      <span>
                        修改日期:{" "}
                        {new Date(item.updated_at).toLocaleDateString()}
                      </span>
                    ) : (
                      <span>
                        新增日期:{" "}
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="article-body">
                  <h2>{item.title}</h2>
                  <div className="article-content">
                    {editingArticleId === item.id ? (
                      <textarea
                        className="form-control d-inline-flex focus-ring text-decoration-none"
                        rows={5}
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        style={{ width: "100%" }}
                      />
                    ) : (
                      <div className="collapsible-content">
                        <motion.div
                          initial={{ height: "4.5em", opacity: 1 }}
                          animate={{
                            height: expandedItems[item.id] ? "auto" : "4.5em",
                            opacity: 1,
                          }}
                          transition={{ duration: 0.5 }}
                          style={{ overflow: "hidden" }}
                        >
                          <div
                            dangerouslySetInnerHTML={{
                              __html: item.content,
                            }}
                          />
                        </motion.div>
                        {item.content.length > 200 && (
                          <span
                            className="toggle-expand"
                            onClick={() => toggleExpand(item.id)}
                          >
                            {expandedItems[item.id]
                              ? "收起全文 ▲"
                              : "展開全文 ▼"}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="article-footer">
                  <span>文章分類：{item.article_category_name}</span>
                  <span>{item.type}</span>
                  <div className="article-actions">
                    {item.created_by === session.user.id && ( // 確保只有使用者本人的文章顯示修改按鈕
                      <>
                        {editingArticleId === item.id ? (
                          <>
                            <button onClick={() => handleSaveClick(item.id)}>
                              保存
                            </button>
                            <button onClick={() => setEditingArticleId(null)}>
                              取消
                            </button>
                          </>
                        ) : (
                          <button onClick={() => handleEditClick(item)}>
                            修改文章
                          </button>
                        )}
                      </>
                    )}
                    <button
                      onClick={() => handleFavoriteClick(item.id)}
                      className="favorite-button"
                    >
                      {favorites.some((fav) => fav.id === item.id)
                        ? "❤️"
                        : "🤍"}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </>
      )}

      {!loading && combinedItems.length > itemsPerPage && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}
