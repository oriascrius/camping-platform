"use client";
import Link from 'next/link'

import "@/styles/pages/product-cart/fill-cart/style.css";

export default function FillCart() {

  return (
    <>
      <main className="fill-cart">
        <section className="order">
          <div className="container">
            <article className="order-item">
              <ul>
                <li className="item active">
                  <div className="num">1</div>
                  <p>購物車</p>
                </li>
                <div className="line active" />
                <li className="item active">
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
                  <p className="text-center">數量</p>
                  <p className="text-center">小計</p>
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
                    <div className="quantity item-style">
                      <p className="text-center">1</p>
                    </div>
                    <div className="subtotal item-style">
                      <p className="text-center">NT$2700</p>
                    </div>
                  </div>
                  <div className="item">
                    <div className="name-pic item-style">
                      <div className="image">
                        <img src="/images/product-cart/cart-2.png" />
                      </div>
                      <p className="name">晴空M 帳篷</p>
                    </div>
                    <div className="quantity item-style">
                      <p className="text-center">1</p>
                    </div>
                    <div className="subtotal item-style">
                      <p className="text-center">NT$2700</p>
                    </div>
                  </div>
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
        <section className="d-p">
          <div className="container">
            <article className="delivery">
              <div className="main">
                <article className="title">
                  <h3>宅配方式</h3>
                </article>
                <article className="content">
                  <div className="item-content">
                    <div className="form-check label-mt">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="flexRadioDefault"
                        id="flexRadioDefault1"
                      />
                      <label
                        className="form-check-label w-100 "
                        htmlFor="flexRadioDefault1"
                      >
                        <div className="d-flex justify-content-between">
                          <p>
                            7-11付款
                            <br />
                            <a href="#">選擇門市</a>
                          </p>
                          <p>NT$60</p>
                        </div>
                      </label>
                    </div>
                    <div className="form-check label-mt">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="flexRadioDefault"
                        id="flexRadioDefault2"
                        defaultChecked
                      />
                      <label
                        className="form-check-label w-100 "
                        htmlFor="flexRadioDefault2"
                      >
                        <div className="d-flex justify-content-between">
                          <p>宅配到府</p>
                          <p>NT$60</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </article>
              </div>
            </article>
            <article className="payment">
              <div className="main">
                <article className="title">
                  <h3>宅配方式</h3>
                </article>
                <article className="content">
                  <div className="item-content">
                    <div className="form-check label-mt">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="flexRadioDefault1"
                        id="flexRadioDefault11"
                      />
                      <label
                        className="form-check-label w-100 "
                        htmlFor="flexRadioDefault11"
                      >
                        <div className="d-flex justify-content-between">
                          <p>貨到付款</p>
                        </div>
                      </label>
                    </div>
                    <div className="form-check label-mt">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="flexRadioDefault1"
                        id="flexRadioDefault22"
                        defaultChecked
                      />
                      <label
                        className="form-check-label w-100 "
                        htmlFor="flexRadioDefault22"
                      >
                        <div className="d-flex justify-content-between">
                          <p>信用卡</p>
                        </div>
                      </label>
                    </div>
                    <div className="form-check label-mt">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="flexRadioDefault1"
                        id="flexRadioDefault33"
                        defaultChecked
                      />
                      <label
                        className="form-check-label w-100 "
                        htmlFor="flexRadioDefault33"
                      >
                        <div className="d-flex justify-content-between">
                          <p>ATM</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </article>
              </div>
            </article>
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
                    <p>運費 :</p>
                    <p>NT$60</p>
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
        <section className="customer-information">
          <div className="container">
            <div className="main">
              <article className="title">
                <h3>顧客資料</h3>
              </article>
              <article className="content">
                <div className="item-content">
                  <div className="mb-3">
                    <label htmlFor="name" className="form-label">
                      顧客名稱:
                    </label>
                    <input type="text" className="form-control" id="name" />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">
                      電子信箱:
                    </label>
                    <input type="email" className="form-control" id="email" />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="phone" className="form-label">
                      電話號碼:
                    </label>
                    <input type="tel" className="form-control" id="phone" />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="address" className="form-label">
                      地址:
                    </label>
                    <input type="text" className="form-control" id="address" />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="textarea" className="form-label">
                      備註:
                    </label>
                    <textarea
                      className="form-control"
                      id="textarea"
                      rows={3}
                      defaultValue={""}
                    />
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>
        <button className="submit">
          <Link href="/product-cart/order-confirmation">送出訂單</Link>
          {/* <a href="order-confirmation.html">送出訂單</a> */}
        </button>
      </main>
    </>
  );
}
