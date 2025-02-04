"use client";
import Link from 'next/link'

export default function Product() {
  return (
    <>
      <section className="order">
        <div className="container">
          <article className="order-item">
            <ul>
              <li className="item active">
                <div className="num">1</div>
                <p>購物車</p>
              </li>
              <div className="line" />
              <li className="item">
                <div className="num">2</div>
                <p>填寫訂單</p>
              </li>
              <div className="line" />
              <li className="item">
                <div className="num">3</div>
                <p>訂單確認</p>
              </li>
            </ul>
          </article>
        </div>
      </section>
      <section className="cart-product">
        <div className="container">
          <div className="main">
            <article className="title">
              <h3>購物車</h3>
            </article>
            <article className="content">
              <div className="header">
                <p>商品資料</p>
                <p className="text-center">單品價錢</p>
                <p className="text-center">數量</p>
                <p className="text-center">小計</p>
                <p className="text-center" />
              </div>
              <hr />
              <div className="item-content">
                <div className="item">
                  <div className="name-pic item-style">
                    <div className="image">
                      <img src="/images/product-cart/cart-1.png" />
                    </div>
                    <p className="name">晴空M 帳篷</p>
                  </div>
                  <div className="price item-style">
                    <p className="text-center">NT$2700</p>
                  </div>
                  <div className="quantity item-style d-flex">
                    <button>-</button>
                    <input
                      className="w-100 text-center"
                      type="text"
                      defaultValue={1}
                    />
                    <button>+</button>
                  </div>
                  <div className="subtotal item-style">
                    <p className="text-center">NT$2700</p>
                  </div>
                  <div className="delete item-style">
                    <button>
                      <img
                        width={26}
                        height={26}
                        src="/images/product-cart/delete-icon.png"
                      />
                    </button>
                  </div>
                </div>
                <div className="item">
                  <div className="name-pic item-style">
                    <div className="image">
                      <img src="/images/product-cart/cart-2.png" />
                    </div>
                    <p className="name">晴空M 帳篷</p>
                  </div>
                  <div className="price item-style">
                    <p className="text-center">NT$2700</p>
                  </div>
                  <div className="quantity item-style d-flex">
                    <button>-</button>
                    <input
                      className="w-100 text-center"
                      type="text"
                      defaultValue={1}
                    />
                    <button>+</button>
                  </div>
                  <div className="subtotal item-style">
                    <p className="text-center">NT$2700</p>
                  </div>
                  <div className="delete item-style">
                    <button>
                      <img
                        width={26}
                        height={26}
                        src="/images/product-cart/delete-icon.png"
                      />
                    </button>
                  </div>
                </div>
              </div>
              <div className="coupon">
                <p>使用的優惠卷</p>
                <select>
                  <option value={1}>請選擇優惠券</option>
                  <option value={2}>優惠券1</option>
                  <option value={3}>優惠券2</option>
                </select>
              </div>
            </article>
            <hr />
            <article className="total">
              <p>總計 :</p>
              <p>NT$2700</p>
            </article>
          </div>
        </div>
      </section>
      <section className="order-product">
        <div className="container">
          <div className="main">
            <article className="title">
              <h3>訂單資訊</h3>
            </article>
            <article className="content">
              <div className="item-content">
                <div className="subtotal d-flex">
                  <p>小計:</p>
                  <p>NT$2700</p>
                </div>
                <article className="discount d-flex">
                  <p>折扣 :</p>
                  <p>NT$-72</p>
                </article>
              </div>
            </article>
            <hr />
            <article className="total">
              <p>總計</p>
              <p>NT$2700</p>
            </article>
          </div>
        </div>
      </section>
      <button className="submit">
        <Link href="/product-cart/fill-cart">送出訂單</Link>
        {/* <a href="fill-cart.html"></a> */}
      </button>
    </>
  );
}
