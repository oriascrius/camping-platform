// Component: CartProducts.jsx
export default function CartProducts() {
  return (
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
                    <img src="/images/product-cart/cart-1.png" alt="" />
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
              {/* Add more items dynamically later */}
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
  );
}
