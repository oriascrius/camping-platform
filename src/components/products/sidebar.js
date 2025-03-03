"use client";

import { useState, useEffect } from "react";

export default function Sidebar({ onFilter }) {
  const [categories, setCategories] = useState([]); // 存儲類別和子類別
  const [openItem, setOpenItem] = useState(null); // 控制打開的類別
  const [selectedSubcategory, setSelectedSubcategory] = useState(null); // 記錄選中的子類別

  // ★ 新增：管理「最低價」與「最高價」的 state
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(99999);

  // 從 API 獲取類別和子類別資料
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/products/category"); // 請求 API
        const data = await response.json();
        setCategories(data); // 更新類別數據
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };
    fetchCategories();
  }, []);

  // 切換類別打開狀態
  const toggleAccordion = (categoryId) => {
    setOpenItem(openItem === categoryId ? null : categoryId);
  };

  // 點擊子類別時觸發的函式
  const handleSubcategoryClick = (categoryId, subcategoryId) => {
    setSelectedSubcategory(subcategoryId); // 記錄選中的子類別
    // ★ 傳遞篩選條件給父組件，增加 minPrice, maxPrice
    onFilter(categoryId, subcategoryId, minPrice, maxPrice);

    // 滑動到頂部
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // 點擊「全部商品」的處理
  const handleAllClick = () => {
    setOpenItem(null);
    setSelectedSubcategory(null);
    onFilter(null, null, minPrice, maxPrice); // ★ 帶上價格範圍
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ★ 當使用者調整價格範圍（任何一端）時，更新 state
  const handlePriceChange = (e, type) => {
    const value = Number(e.target.value);

    if (type === "min") {
      if (value > maxPrice) {
        // 若拉到比 maxPrice 還高，就把 maxPrice 跟著拉上來
        setMaxPrice(value);
      }
      setMinPrice(value);
    } else {
      if (value < minPrice) {
        // 若拉到比 minPrice 還低，就把 minPrice 跟著往下
        setMinPrice(value);
      }
      setMaxPrice(value);
    }
  };

  // ★ 用來在使用者調整完後，即時呼叫 onFilter
  //   也可以做「套用按鈕」的方式，而不是 onBlur
  const handlePriceBlur = () => {
    // ★ 重新呼叫父層 onFilter，保留原本的category/subcategory
    //    讓父層按現在的 minPrice / maxPrice 篩選
    onFilter(
      openItem, // 目前打開的主分類
      selectedSubcategory,
      minPrice,
      maxPrice
    );
  };

  return (
    <div className="col-lg-3 mb-4">
      <div className="cate-aside">
        <div className="accordion" id="sidebarAccordion">
          {/* 全部商品 按鈕 */}
          <div className="accordion-item">
            <button
              className="accordion-button all"
              type="button"
              onClick={handleAllClick}
            >
              全部商品
            </button>
          </div>

          {/* 類別與子類別清單 */}
          {categories.map((category) => (
            <div key={category.id} className="accordion-item">
              <h2 className="accordion-header" id={`heading-${category.id}`}>
                <button
                  className={`accordion-button ${
                    openItem === category.id ? "" : "collapsed"
                  }`}
                  type="button"
                  onClick={() => toggleAccordion(category.id)}
                >
                  {category.name}
                </button>
              </h2>

              <div
                id={`collapse-${category.id}`}
                className={`accordion-collapse collapse ${
                  openItem === category.id ? "show" : ""
                }`}
              >
                <div className="accordion-body">
                  <ul className="list-group list-group-flush">
                    {category.subcategories.map((subcategory) => (
                      <li key={subcategory.id} className="list-group-item">
                        <button
                          className={`list-group-item w-100 text-start ${
                            selectedSubcategory === subcategory.id
                              ? "selected"
                              : ""
                          }`}
                          onClick={() =>
                            handleSubcategoryClick(category.id, subcategory.id)
                          }
                        >
                          {subcategory.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* ★ 可以在這裡插入價格範圍區塊 */}
        <div className="accordion-item">
          <div className="accordion-header">
            <h5 className="p-3 m-0">價格範圍</h5>
          </div>
          <div className="accordion-body d-flex flex-column px-3">
            {/* 最低價 */}
            <label htmlFor="minPrice" className="form-label">
              最低價：{minPrice}
            </label>
            <input
              id="minPrice"
              type="range"
              min="0"
              max="99999"
              className="my-price-range"
              step="50"
              value={minPrice}
              onChange={(e) => handlePriceChange(e, "min")}
              onMouseUp={handlePriceBlur} // ★ 失焦時呼叫篩選
            />

            {/* 最高價 */}
            <label htmlFor="maxPrice" className="form-label mt-3">
              最高價：{maxPrice}
            </label>
            <input
              id="maxPrice"
              type="range"
              min="0"
              max="99999"
              className="my-price-range"
              step="10"
              value={maxPrice}
              onChange={(e) => handlePriceChange(e, "max")}
              onMouseUp={handlePriceBlur}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
