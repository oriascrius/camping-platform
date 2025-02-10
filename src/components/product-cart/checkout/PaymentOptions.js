export default function PaymentOptions() {
  return (
    <section className="d-p">
      <div className="container">
        <article className="payment">
          <div className="main">
            <article className="title">
              <h3>付款方式</h3>
            </article>
            <article className="content">
              <div className="item-content">
                <div className="form-check label-mt">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="paymentMethod"
                    id="payment1"
                  />
                  <label className="form-check-label w-100" htmlFor="payment1">
                    <div className="d-flex justify-content-between">
                      <p>貨到付款</p>
                    </div>
                  </label>
                </div>
                <div className="form-check label-mt">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="paymentMethod"
                    id="payment2"
                    defaultChecked
                  />
                  <label className="form-check-label w-100" htmlFor="payment2">
                    <div className="d-flex justify-content-between">
                      <p>信用卡</p>
                    </div>
                  </label>
                </div>
              </div>
            </article>
          </div>
        </article>
      </div>
    </section>
  );
}
