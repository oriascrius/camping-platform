export default function OrderSummary() {
  return (
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
            <p>NT$2760</p>
          </article>
        </div>
      </div>
    </section>
  );
}
