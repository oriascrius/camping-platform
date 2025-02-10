// Component: DeliveryOptions.jsx
export default function DeliveryOptions() {
  return (
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
                    name="deliveryMethod"
                    id="delivery1"
                  />
                  <label className="form-check-label w-100" htmlFor="delivery1">
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
                    name="deliveryMethod"
                    id="delivery2"
                    defaultChecked
                  />
                  <label className="form-check-label w-100" htmlFor="delivery2">
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
      </div>
    </section>
  );
}
