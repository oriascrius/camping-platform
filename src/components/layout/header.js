"use client";

import "@/styles/shared/header.css";
import Image from "next/image";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { CartSidebar } from "@/components/camping/cart/CartSidebar";
import { ProductCartSidebar } from "@/components/product-cart/ProductCartSidebar"; // 商品購物車側邊欄
import { FavoritesSidebar } from "@/components/camping/favorites/FavoritesSidebar";
import { FaHeart } from "react-icons/fa";
import { FavoritesIcon } from "@/components/camping/favorites/FavoritesIcon";
import { useProductCart } from "@/hooks/useProductCart";
// 通知組件
import NotificationBell from "@/components/common/NotificationBell";

export default function Header() {
  // 使用者登入狀態管理
  const { data: session } = useSession();

  // 購物車和收藏清單的狀態管理
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isProductCartOpen, setIsProductCartOpen] = useState(false); // 商品購物車側邊欄狀態
  const [isCampingCartOpen, setIsCampingCartOpen] = useState(false);
  const [campingCartCount, setCampingCartCount] = useState(0);
  const { productCartCount, fetchCart } = useProductCart(); //從鉤子內抓取商品購物車數量狀態以及fetch函式用以抓取數量
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isCampingFavorites, setIsCampingFavorites] = useState(false);

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

  // 處理營地購物車點擊事件
  const handleCampingCartClick = () => {
    setIsCartOpen(true);
    setIsCampingCartOpen(true);
  };

  // 處理商品購物車點擊事件
  const handleProductCartClick = (e) => {
    e.preventDefault(); // 阻止 `<a>` 預設行為
    setIsCartOpen(false); // 確保不影響老大的購物車
    setIsCampingCartOpen(false); // 避免誤開營地購物車
    setIsProductCartOpen(true); // 確保 **只開啟商品購物車**
  };

  // 處理收藏清單點擊事件
  const handleProductFavoritesClick = () => {
    setIsFavoritesOpen(true);
    setIsCampingFavorites(false);
  };

  const handleCampingFavoritesClick = () => {
    setIsFavoritesOpen(true);
    setIsCampingFavorites(true);
  };

  // 監聽購物車更新事件
  useEffect(() => {
    if (session?.user) {
      fetchCartCount();
      fetchCart(); //偷放一個商品購物車fetch
    }

    // 註冊購物車更新事件監聽器
    const handleCartUpdate = () => {
      fetchCartCount();
      fetchCart();
    };

    window.addEventListener("cartUpdate", handleCartUpdate);

    // 清理事件監聽器
    return () => {
      window.removeEventListener("cartUpdate", handleCartUpdate);
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
          <li className="item">
            <form className="d-flex" role="search">
              <input
                className="form-control search-input"
                type="search"
                placeholder="Search"
                aria-label="Search"
              />
              <button className="btn search-bg" type="submit">
                <Image
                  src="/images/header/search.png"
                  width={20}
                  height={20}
                  alt="search"
                />
              </button>
            </form>
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
              <div style={{ display: "flex", alignItems: "center" }}>
                <FavoritesIcon
                  onClick={() => {}}
                  style={{
                    width: "24px",
                    height: "24px",
                    color: "var(--brand-color_2)",
                  }}
                />
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
                      className="cart-item"
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
          <li>
            <Link href="/get-coupon">
              <Image
                src="/images/header/user.png"
                width={24}
                height={24}
                alt="user"
              />
            </Link>
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
        isOpen={isProductCartOpen} // 🛠️ 只由 `isProductCartOpen` 控制
        setIsOpen={setIsProductCartOpen}
      />

      {/* 側邊收藏清單組件 */}
      <FavoritesSidebar
        isOpen={isFavoritesOpen}
        setIsOpen={setIsFavoritesOpen}
        isCampingFavorites={isCampingFavorites}
      />

      {/* 右側功能區 */}
      <div className="flex items-center gap-4">
        <NotificationBell />
      </div>
    </header>
  );
}
