"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import SearchBar from "./search-bar";
import SortAndFilter from "./sort-filter";
import "bootstrap-icons/font/bootstrap-icons.css";
import { useSession } from "next-auth/react";

export default function ArticlesAndFavoritesDetails() {
  const { data: session, status } = useSession();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("");
  const [filterOption, setFilterOption] = useState("");
  const [articles, setArticles] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [editingArticleId, setEditingArticleId] = useState(null);
  const [editedContent, setEditedContent] = useState("");

  useEffect(() => {
    if (status === "loading") return; // 等待會話加載完成

    if (!session) {
      console.error("No session found");
      return;
    }

    const userId = session.user.id; // 從會話中獲取用戶 ID

    axios
      .get(`/api/member/articles/${userId}`) // 在 API 請求中包含 userId
      .then((response) => {
        setArticles(response.data);
      })
      .catch((error) => {
        console.error("There was an error fetching the articles!", error);
      });

    axios
      .get(`/api/member/favorites/${userId}`) // 獲取用戶的收藏文章
      .then((response) => {
        setFavorites(response.data);
      })
      .catch((error) => {
        console.error("There was an error fetching the favorites!", error);
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
    // 在這裡處理篩選邏輯
  };

  const handleEditClick = (article) => {
    setEditingArticleId(article.id);
    setEditedContent(article.content);
  };

  const handleSaveClick = (articleId) => {
    axios
      .put(`/api/member/articles/${session.user.id}`, {
        id: articleId,
        content: editedContent,
      })
      .then((response) => {
        setArticles((prevArticles) =>
          prevArticles.map((article) =>
            article.id === articleId
              ? { ...article, content: editedContent }
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
        .delete(`/api/member/favorites/${session.user.id}/${articleId}`)
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
        .post(`/api/member/favorites/${session.user.id}`, { articleId })
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

  const filteredArticles = articles
    .filter(
      (article) =>
        (article.title?.includes(searchTerm) ||
          article.content?.includes(searchTerm) ||
          article.nickname?.includes(searchTerm) ||
          article.article_category_name?.includes(searchTerm) ||
          article.date?.includes(searchTerm) ||
          article.type?.includes(searchTerm)) &&
        (filterOption === "" || article.type === filterOption)
    )
    .sort((a, b) => {
      if (sortOption === "date") {
        return new Date(b.created_at) - new Date(a.created_at);
      } else if (sortOption === "popularity") {
        return b.popularity - a.popularity;
      }
      return 0;
    });

  const filteredFavorites = favorites
    .filter(
      (article) =>
        (article.title?.includes(searchTerm) ||
          article.content?.includes(searchTerm) ||
          article.nickname?.includes(searchTerm) ||
          article.article_category_name?.includes(searchTerm) ||
          article.date?.includes(searchTerm) ||
          article.type?.includes(searchTerm)) &&
        (filterOption === "" || article.type === filterOption)
    )
    .sort((a, b) => {
      if (sortOption === "date") {
        return new Date(b.created_at) - new Date(a.created_at);
      } else if (sortOption === "popularity") {
        return b.popularity - a.popularity;
      }
      return 0;
    });

  const sortOptions = [
    { value: "", label: "未選擇" },
    { value: "date", label: "日期" },
    { value: "type", label: "收藏數" },
  ];

  const filterOptions = [
    { value: "", label: "未選擇" },
    { value: "camping", label: "露營知識" },
    { value: "hiking", label: "登山知識" },
    // ...其他類型
  ];

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
      <h2>我的文章</h2>
      {filteredArticles.map((article, index) => (
        <div key={index} className="article-card">
          <div className="article-header">
            <img
              src={`/images/member/${article.avatar}`}
              alt={article.nickname}
            />
            <div className="article-nickname">{article.nickname}</div>
          </div>
          <div className="article-body">
            <h2>{article.title}</h2>
            <p className="article-content">
              {editingArticleId === article.id ? (
                <textarea
                  className="form-control"
                  rows={5}
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  style={{ width: "100%" }}
                />
              ) : (
                <span dangerouslySetInnerHTML={{ __html: article.content }} />
              )}
            </p>
          </div>
          <div className="article-footer">
            <span>文章分類：{article.article_category_name}</span>
            <span>{article.type}</span>
            <div className="article-actions">
              {editingArticleId === article.id ? (
                <>
                  <button onClick={() => handleSaveClick(article.id)}>
                    保存
                  </button>
                  <button onClick={() => setEditingArticleId(null)}>
                    取消
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => handleEditClick(article)}>
                    修改文章
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
      <h2>我的收藏</h2>
      {filteredFavorites.map((article, index) => (
        <div key={index} className="article-card">
          <div className="article-header">
            <img
              src={`/images/member/${article.avatar}`}
              alt={article.nickname}
            />
            <div className="article-nickname">{article.nickname}</div>
          </div>
          <div className="article-body">
            <h2>{article.title}</h2>
            <p className="article-content">
              {editingArticleId === article.id ? (
                <textarea
                  className="form-control"
                  rows={5}
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  style={{ width: "100%" }}
                />
              ) : (
                <span dangerouslySetInnerHTML={{ __html: article.content }} />
              )}
            </p>
          </div>
          <div className="article-footer">
            <span>文章分類：{article.article_category_name}</span>
            <span>{article.type}</span>
            <div className="article-actions">
              <button
                onClick={() => handleFavoriteClick(article.id)}
                className="favorite-button"
              >
                {favorites.some((fav) => fav.id === article.id) ? "❤️" : "🤍"}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
