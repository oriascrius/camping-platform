// Component: DeliveryOptions.jsx
export default function DeliveryOptions({ deliveryMethod, onChange }) {
  return (
    <section className="d-p">
      <div className="container">
        <article className="delivery">
          <div className="main">
            {/* 標題 */}
            <article className="title">
              <h3>宅配方式</h3>
            </article>

            {/* 宅配方式選擇 */}
            <article className="content">
              <div className="item-content">
                {/* 7-11 付款選項 */}
                <div className="form-check label-mt">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="deliveryMethod"
                    id="delivery1"
                    value={"7-11"}
                    checked={deliveryMethod === "7-11"} // ✅ 確保 UI 反映狀態
                    onChange={() => onChange("7-11")} // ✅ 只有當選擇時才執行 onChange
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

                {/* 宅配到府選項 */}
                <div className="form-check label-mt">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="deliveryMethod"
                    id="delivery2"
                    value={"home_delivery"}
                    checked={deliveryMethod === "home_delivery"} // ✅ 確保 UI 反映狀態
                    onChange={() => onChange("home_delivery")} // ✅ 只有當選擇時才執行 onChange
                  />
                  <label className="form-check-label w-100" htmlFor="delivery2">
                    <div className="d-flex justify-content-between">
                      <p>宅配到府</p>
                      <p>NT$100</p>
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
