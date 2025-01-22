"use client";
// import "@/node_modules/bootstrap/dist/css/bootstrap.min.css";
// import "@/node_modules/bootstrap/dist/js/bootstrap.bundle.min.js";
import "@/styles/shared/header.css";
import Image from 'next/image';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="header d-flex justify-content-between align-items-center" id="header">
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

      <article className="right-nav">
        <ul className="d-flex justify-content-between align-items-center">
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
            <Link href="/forum">
              <p className="m-0">社群討論區</p>
            </Link>
          </li>
          <li className="item">
            <Link href="/member">
              <p className="m-0">會員專區</p>
            </Link>
          </li>
          <li className="item">
            <form className="d-flex" role="search">
              <input
                className="form-control search-input"
                type="search"
                placeholder="Search"
                aria-label="Search"
              />
              <button className="btn search-bg" type="submit">
                <Image src="/images/header/search.png" width={20} height={20} alt="search" />
              </button>
            </form>
          </li>

          {/* 購物車下拉選單 */}
          <li className="dropdown-center item">
            <a className="dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" href="#">
              <Image src="/images/header/cart.png" width={24} height={24} alt="cart" />
            </a>
            <ul className="dropdown-menu">
              <div className="memeber">
                <div className="main">
                  <article className="title">
                    <h3>購物車</h3>
                  </article>
                  <ul className="content">
                    {/* 購物車項目 */}
                    <li className="d-flex li">
                      <div className="image">
                        <Image src="/images/header/image 63.jpg" width={80} height={80} alt="product" />
                      </div>
                      <div className="text">
                        <p>3 人露營帳篷 MH100 Fresh</p>
                        <p><span>1</span> X NT$<span>1200</span></p>
                      </div>
                    </li>
                  </ul>
                  <button>
                    <Link href="/cart">訂單結帳</Link>
                  </button>
                </div>
              </div>
            </ul>
          </li>

          {/* 營主下拉選單 */}
          <li className="dropdown-center item">
            <a className="dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" href="#">
              <Image src="/images/header/camp_owner.png" width={24} height={24} alt="camp owner" />
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
            <a className="dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" href="#">
              <Image src="/images/header/user.png" width={24} height={24} alt="user" />
              <span className="num">1</span>
            </a>
            <ul className="dropdown-menu">
              <div className="memeber">
                <div className="main">
                  <article className="title">
                    <h3>會員專區</h3>
                  </article>
                  <ul className="content">
                    <li>
                      <Link href="/member/coupon">
                        <Image 
                          className="member-img" 
                          src="/images/header/1737511517859.jpg" 
                          width={60} 
                          height={60}
                          alt="member" 
                        />
                      </Link>
                    </li>
                  </ul>
                  <button>
                    <Link href="/auth/login">會員登入</Link>
                  </button>
                </div>
              </div>
            </ul>
          </li>
        </ul>
      </article>
    </header>
  );
} 