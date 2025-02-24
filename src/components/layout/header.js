"use client";

import "@/styles/shared/header.css";
import Image from "next/image";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import SearchBar from "@/components/header/search";
import SearchList from "@/components/header/searchList";
import { CartSidebar } from "@/components/camping/cart/CartSidebar";
import { ProductCartSidebar } from "@/components/product-cart/ProductCartSidebar"; // 商品購物車側邊欄
import { ProductFavSidebar } from "@/components/products/ProductFavSideBar"; //商品fav
import { FavoritesSidebar } from "@/components/camping/favorites/FavoritesSidebar";
import { FaHeart } from "react-icons/fa";
import { FavoritesIcon } from "@/components/camping/favorites/FavoritesIcon";
import { useProductCart } from "@/hooks/useProductCart";
import { FiMenu } from "react-icons/fi"; // 選單icon
import { IoClose } from "react-icons/io5"; // 關閉icon
// 通知組件
import NotificationBell from "@/components/common/NotificationBell";

export default function Header() {
  // 使用者登入狀態管理
  const { data: session } = useSession();

  // 購物車和收藏清單的狀態管理
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCampingCartOpen, setIsCampingCartOpen] = useState(false);
  const [campingCartCount, setCampingCartCount] = useState(0);
  
  const {
    productCartCount,
    fetchCart,
    isProductCartOpen,
    setIsProductCartOpen,
  } = useProductCart(); //從鉤子內抓取商品購物車數量狀態以及fetch函式用以抓取數量以及控制是否開啟的狀態用來往下傳
  const [isProductFavOpen, setIsProductFavOpen] = useState(false); //商品側欄開關
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isCampingFavorites, setIsCampingFavorites] = useState(false);
  const [productFavCount, setProductFavCount] = useState(0); // 新增商品收藏數量狀態
  const [campingFavCount, setCampingFavCount] = useState(0); // 新增營地收藏數量狀態

  // 獲取購物車數量的API請求
  const fetchCartCount = async () => {
    try {
      if (session?.user?.id) {
        const response = await fetch("/api/camping/cart");
        const data = await response.json();
        setCampingCartCount(data.cartItems?.length || 0);
      }
    } catch (error) {
      console.error("獲取購物車數量失敗:", error);
      setCampingCartCount(0);
    }
  };

  // 優化獲取商品收藏數量
  const fetchProductFavCount = async () => {
    try {
      if (session?.user?.id) {
        const response = await fetch("/api/products/productFav");
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        
        if (data.success) {
          setProductFavCount(data.wishlist?.length || 0);
        }
      }
    } catch (error) {
      console.error("獲取商品收藏數量失敗:", error);
      setProductFavCount(0);
    }
  };

  // 優化獲取營地收藏數量
  const fetchCampingFavCount = async () => {
    try {
      if (session?.user?.id) {
        const response = await fetch("/api/camping/favorites", {
          headers: {
            'Cache-Control': 'no-cache',  // 避免快取
          }
        });
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setCampingFavCount(data.favorites?.length || 0);
      }
    } catch (error) {
      console.error("獲取營地收藏數量失敗:", error);
    }
  };


  
  //搜尋功能
  // 添加狀態來管理搜尋框的值
  const [selectedValue, setSelectedValue] = useState("0"); // 初始值设为 "1"
  const [searchText, setSearchText] = useState("");
  const [ searchQuery, setSearchQuery] = useState([]);
  const [ allProducts, setAllProducts] = useState([]); // 存儲所有產品
  const inputRef = useRef(null); // 參考搜尋框
  const searchListRef = useRef(null); // 參考搜尋建議列表


//   useEffect(() => {
//     fetchSearch(selectedValue); // 组件加载时 fetch 初始数据
//     setSearchQuery([]); // 清空搜索结果
// }, [selectedValue]);  // 监听 selectedValue

 

  const handleSelectChange = (e) => {
    // const value = e.target.value;
    // console.log(value);
    setSelectedValue(e); // 更新選擇的值
    console.log('value:',e.value)
    fetchSearch(e);
    // console.log('45454564')
    // if (e === "1") {
      
    //   console.log('1111')
    // }else if (e === "2") {
    //   console.log('2222')
    //   console.log(e.target.value)
    // }else if (e === "3") {
    //   console.log('3333')
    // }
  }

  // useEffect(() => {
  //   handleFocus(selectedValue); // 组件加载时 fetch 初始数据
  // },[])

  const handleFocus = (selectedValue) => {
    console.log('selectedValue:' ,selectedValue); // 打印当前选中的值
    fetchSearch(selectedValue); // 根据选中的值获取数据
  }

  
const fetchSearch = async (e) => {
  //監聽select 的值，根據值去fetch不同的api
  // console.log("fetchSearch 传入的值:", e);

  console.log("fetchSearch 传入的值:", e);
     // 只允许 "1"（产品） 和 "2"（文章），否则默认用 "1" 查询产品
    if (e === "1") {
        try {
          const response = await fetch("/api/search/product");
          const data = await response.json();
          setSearchQuery(data);
          setAllProducts(data); // 初始化完整商品数据
          console.log("搜索结果:", data);
        } catch (error) {
          console.error("获取搜索结果失败:", error);
        }
        return  
    }else if (e === "2") {
      try {
        const response = await fetch("/api/search/forum");
        const data = await response.json();
        setSearchQuery(data);
        setAllProducts(data); // 初始化完整商品数据
        console.log("搜索结果:", data);
      } catch (error) {
        console.error("获取搜索结果失败:", error);
      }
      console.log('22222')
      return
    }else if (e === "3") {
      try {
        const response = await fetch("/api/search/camping");
        const data = await response.json();
        setSearchQuery(data);
        setAllProducts(data); // 初始化完整商品数据
        console.log("搜索结果:", data);
      } catch (error) {
        console.error("获取搜索结果失败:", error);
      }
      console.log('22222')
      return
    }
};


  const handleSearch = (query) => {
    setSearchText(query); // ✅ 更新 searchText 狀態
    if (query === "") {
      setSearchQuery([]); // ✅ 确保搜索框为空时，清空搜索结果
      return;
    }
    let searchList = [];
    if (selectedValue === "1") {
       searchList = allProducts.filter((product) =>
        product.name.toLowerCase().includes(query.toLowerCase())
      );
    }else if (selectedValue === "2") {
      searchList = allProducts.filter((product) =>
        product.thread_title.toLowerCase().includes(query.toLowerCase())
      );
    }else if (selectedValue === "3") {
      searchList = allProducts.filter((product) =>
        product.title.toLowerCase().includes(query.toLowerCase())
      );
    }
    setSearchQuery(searchList);
  }

   // 點擊事件處理，點擊空白處時清空輸入框並隱藏搜尋列表
   const handleClickOutside = (e) => {
    if (inputRef.current?.contains(e.target) || // 搜索框
    e.target.closest(".swiper-button-disabled.swiper-button-prev") || // Swiper 上一页按钮
    e.target.closest(".swiper-button-prev") || // Swiper 上一页按钮
    e.target.closest(".swiper-button-next")) // Swiper 下一页按钮 
    {
      return; // 如果點擊的是搜尋框或搜尋列表，則不執行任何操作
    }
    setSearchQuery([]);
    setSearchText(""); // ✅ 清空輸入框內容
  };

  // 添加和清理點擊事件監聽
  useEffect(() => {
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [searchQuery]);


  
  

  // 添加和清理點擊事件監聽
  useEffect(() => {
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [searchQuery]);

  // 處理營地購物車點擊事件
  const handleCampingCartClick = () => {
    setIsCartOpen(true);
    setIsCampingCartOpen(true);
  };

  // 處理商品購物車點擊事件
  const handleProductCartClick = (e) => {
    e.preventDefault(); // 阻止 <a> 預設行為
    setIsCartOpen(false); // 確保不影響老大的購物車
    setIsCampingCartOpen(false); // 避免誤開營地購物車
    setIsProductCartOpen(true); // 確保 **只開啟商品購物車**
  };

  // 處理收藏清單點擊事件
  const handleProductFavoritesClick = () => {
    setIsFavoritesOpen(false);
    setIsCampingFavorites(false);
    setIsProductFavOpen(true);
  };

  const handleCampingFavoritesClick = () => {
    setIsFavoritesOpen(true);
    setIsCampingFavorites(true);
    setIsProductFavOpen(false);
  };

  useEffect(() => {
    if (session?.user) {
      fetchCartCount(); // 營地購物車數量
      fetchCart(); //偷放一個商品購物車fetch
      fetchProductFavCount(); // 商品收藏數量
      fetchCampingFavCount(); // 營地收藏數量
    }

    const handleCartUpdate = () => {
      fetchCartCount();
      fetchCart();
    };

    const handleFavUpdate = () => {
      fetchProductFavCount();
      fetchCampingFavCount();
    };

    const handleProductFavUpdate = async () => {
      await fetchProductFavCount();
    };

    window.addEventListener("cartUpdate", handleCartUpdate);
    window.addEventListener("favoritesUpdate", handleFavUpdate);
    window.addEventListener("productFavUpdate", handleProductFavUpdate);
    window.addEventListener("campingFavUpdate", handleFavUpdate);

    return () => {
      window.removeEventListener("cartUpdate", handleCartUpdate);
      window.removeEventListener("favoritesUpdate", handleFavUpdate);
      window.removeEventListener("productFavUpdate", handleProductFavUpdate);
      window.removeEventListener("campingFavUpdate", handleFavUpdate);
    };
  }, [session]);

  return (
    <header
      className="header d-flex justify-content-between align-items-center"
      id="header"
    >
      {/* 左側導航區域 */}
      <article className="left-nav d-flex">
        <div className="logo">
          <Link href="/">
            <Image
              className="header-logo"
              src="/images/header/logo.png"
              width={154}
              height={106}
              alt="logo"
              priority
            />
          </Link>
        </div>
        <h1 className="d-none">camping</h1>
      </article>

      {/* 右側導航區域 */}
      <article className="right-nav">
        <ul className="d-flex justify-content-between align-items-center">
          {/* 主要導航選項 */}
          <li className="item">
            <Link href="/camping/activities">
              <p className="m-0">找營區</p>
            </Link>
          </li>
          <li className="item">
            <Link href="/products">
              <p className="m-0">商品列表</p>
            </Link>
          </li>
          <li className="item">
            <Link href="/products-lease">
              <p className="m-0">商品租借</p>
            </Link>
          </li>
          <li className="item">
            <Link href="/forum">
              <p className="m-0">社群討論區</p>
            </Link>
          </li>
          <li className="item">
            <Link href="/member">
              <p className="m-0">會員專區</p>
            </Link>
          </li>

          {/* 搜尋欄 */}
          <li className="item search-bar">
            <SearchBar 
            // onChange={handleSelectChange}
            value={searchText}
            onSearch={handleSearch}
            onFocus={handleFocus}
            ref={inputRef}
            selectedValue={selectedValue}
            setSelectedValue={handleSelectChange}/>
          </li>

          {/* 購物車下拉選單 */}
          <li className="dropdown-center item">
            <a
              className="dropdown-toggle"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              href="#"
            >
              <Image
                src="/images/header/cart.png"
                width={24}
                height={24}
                alt="cart"
              />
              {(campingCartCount > 0 || productCartCount > 0) && (
                <span className="num">
                  {campingCartCount + productCartCount}
                </span>
              )}
            </a>
            <ul className="dropdown-menu">
              <div className="memeber">
                <div className="main">
                  <article className="title">
                    <h3>購物車</h3>
                  </article>
                  <ul className="content">
                    {/* 商品購物車選項 */}
                    <li
                      className="d-flex align-items-center justify-content-between p-3 cart-item"
                      onClick={handleProductCartClick}
                      style={{
                        cursor: "pointer",
                        borderBottom: "1px solid var(--brand-color_6)",
                      }}
                    >
                      <div className="d-flex align-items-center">
                        <Image
                          src="/images/header/cart.png"
                          width={24}
                          height={24}
                          alt="product cart"
                          className="me-2"
                        />

                        <span>商品購物車</span>
                      </div>
                      {productCartCount > 0 && (
                        <span className="badge bg-secondary">
                          {productCartCount}
                        </span>
                      )}
                    </li>

                    {/* 營地購物車選項 */}
                    <li
                      className="d-flex align-items-center justify-content-between p-3 cart-item"
                      onClick={handleCampingCartClick}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="d-flex align-items-center">
                        <Image
                          src="/images/header/camp_owner.png"
                          width={24}
                          height={24}
                          alt="camping cart"
                          className="me-2"
                        />
                        <span>營地預約</span>
                      </div>
                      {campingCartCount > 0 && (
                        <span className="badge bg-secondary">
                          {campingCartCount}
                        </span>
                      )}
                    </li>
                  </ul>
                </div>
              </div>
            </ul>
          </li>

          {/* 收藏清單下拉選單 */}
          <li className="dropdown-center item">
            <a
              className="dropdown-toggle"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              href="#"
            >
              <div style={{ display: "flex", alignItems: "center", position: "relative" }}>
                <FavoritesIcon
                  onClick={() => {}}
                  style={{
                    width: "24px",
                    height: "24px",
                    color: "var(--brand-color_2)",
                  }}
                />
                {(productFavCount > 0 || campingFavCount > 0) && (
                  <span className="num">
                    {productFavCount + campingFavCount}
                  </span>
                )}
              </div>
            </a>
            <ul className="dropdown-menu">
              <div className="member">
                <div className="main">
                  <article className="title">
                    <h3>收藏清單</h3>
                  </article>
                  <ul className="content">
                    {/* 商品收藏選項 */}
                    <li
                      onClick={handleProductFavoritesClick}
                      className="cart-item me-0"
                      style={{
                        borderBottom: "1px solid var(--brand-color_6)",
                        padding: "1rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <FaHeart
                          style={{
                            width: "24px",
                            height: "24px",
                            color: "var(--brand-color_2)",
                            marginRight: "0.5rem",
                          }}
                        />
                        <span>商品收藏</span>
                      </div>
                      {productFavCount > 0 && (
                        <span className="badge bg-secondary">{productFavCount}</span>
                      )}
                    </li>

                    {/* 營地收藏選項 */}
                    <li
                      className="cart-item"
                      onClick={handleCampingFavoritesClick}
                      style={{
                        cursor: "pointer",
                        padding: "1rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <FaHeart
                          style={{
                            width: "24px",
                            height: "24px",
                            color: "var(--brand-color_2)",
                            marginRight: "0.5rem",
                          }}
                        />
                        <span>營地收藏</span>
                      </div>
                      {campingFavCount > 0 && (
                        <span className="badge bg-secondary">{campingFavCount}</span>
                      )}
                    </li>
                  </ul>
                </div>
              </div>
            </ul>
          </li>

          {/* 營主下拉選單 */}
          <li className="dropdown-center item">
            <a
              className="dropdown-toggle"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              href="#"
            >
              <Image
                src="/images/header/camp_owner.png"
                width={24}
                height={24}
                alt="camp owner"
              />
            </a>
            <ul className="dropdown-menu">
              <div className="memeber">
                <div className="main">
                  <article className="title">
                    <h3>營地專區</h3>
                  </article>
                  <ul className="content"></ul>
                  <button>
                    <Link href="/owner/login">營主登入</Link>
                  </button>
                </div>
              </div>
            </ul>
          </li>

          {/* 會員下拉選單 */}
          <li className="dropdown-center item">
            <a
              className="dropdown-toggle d-flex align-items-center"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              href="#"
            >
              <Image
                src="/images/header/user.png"
                width={24}
                height={24}
                alt="user"
              />
              {session?.user && (
                <span
                  className="ms-2"
                  style={{
                    color: "var(--brand-color_2)",
                    fontSize: "20px",
                    fontWeight: 700,
                  }}
                >
                  {session.user.name}
                </span>
              )}
            </a>
            <ul className="dropdown-menu">
              <div className="memeber">
                <div className="main">
                  <article className="title">
                    <h3>會員專區</h3>
                  </article>
                  <ul className="content">
                    <li>
                      {/* <Link href="/member/coupon">
                        <Image
                          className="member-img"
                          src="/images/header/1737511517859.jpg"
                          width={120}
                          height={120}
                          quality={100}
                          sizes="(max-width: 768px) 60px, 120px"
                          alt="member"
                        />
                      </Link> */}
                    </li>
                  </ul>
                  {/* 登入/登出按鈕 */}
                  {session?.user ? (
                    <Link href="/auth/logout">
                      <button type="button">登出</button>
                    </Link>
                  ) : (
                    <Link href="/auth/login">
                      <button type="button">會員登入</button>
                    </Link>
                  )}
                </div>
              </div>
            </ul>
          </li>
          <li className="item">
            <IoClose />
          </li>
        </ul>
      </article>

      {/* 側邊購物車組件 */}
      <CartSidebar
        isOpen={isCartOpen}
        setIsOpen={setIsCartOpen}
        isCampingCart={isCampingCartOpen}
      />

      {/* 側邊商品購物車組件 */}
      <ProductCartSidebar
        isOpen={isProductCartOpen} // 🛠️ 只由 isProductCartOpen 控制
        setIsOpen={setIsProductCartOpen}
      />

      {/* 側邊收藏清單組件 */}
      <FavoritesSidebar
        isOpen={isFavoritesOpen}
        setIsOpen={setIsFavoritesOpen}
        isCampingFavorites={isCampingFavorites}
      />
      {/* 商品Fav */}
      <ProductFavSidebar
        isOpen={isProductFavOpen}
        setIsOpen={setIsProductFavOpen}
      />

      {/* 右側功能區 */}
      <div className="flex items-center gap-4">
        <NotificationBell />
      </div>
      {/* 只在 searchQuery 非空时显示 SearchList */}
      {searchQuery?.length > 0 && <SearchList searchQuery={searchQuery} selectedValue={selectedValue}  ref={searchListRef}/>}
      <button className="navMenu">
          <FiMenu /> {/* 選單按鈕 */}
      </button>
    </header>
  );
}