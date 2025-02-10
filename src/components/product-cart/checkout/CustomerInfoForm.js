export default function CustomerInfoForm() {
  return (
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
  );
}
