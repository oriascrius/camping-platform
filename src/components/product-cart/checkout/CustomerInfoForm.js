export default function CustomerInfoForm({ customerInfo, onChange }) {
  return (
    <section className="customer-information">
      {" "}
      {/* 顧客資訊的主要區塊 */}
      <div className="container">
        {" "}
        {/* Bootstrap 容器，提供適當的寬度與間距 */}
        <div className="main">
          {" "}
          {/* 主要內容區域 */}
          <article className="title">
            {" "}
            {/* 標題區域 */}
            <h3>顧客資料</h3>
          </article>
          <article className="content">
            {" "}
            {/* 內容區域 */}
            <div className="item-content">
              {" "}
              {/* 各個輸入項目的容器 */}
              {/* 顧客名稱輸入框 */}
              <div className="mb-3">
                {" "}
                {/* Bootstrap 設定的間距 */}
                <label htmlFor="name" className="form-label">
                  顧客名稱:
                </label>
                <input
                  type="text" /* 設定輸入類型為文字 */
                  className="form-control" /* Bootstrap 內建的輸入框樣式 */
                  id="name" /* 唯一 ID，供 label 參照 */
                  name="name" /* name 屬性對應 customerInfo 內的 key */
                  value={
                    customerInfo.name
                  } /* 受控組件，值來自父層傳入的 customerInfo 狀態 */
                  onChange={onChange} /* 當使用者輸入時，調用父層函式更新狀態 */
                />
              </div>
              {/* 電子信箱輸入框 */}
              <div className="mb-3">
                <label htmlFor="email" className="form-label">
                  電子信箱:
                </label>
                <input
                  type="email" /* 設定輸入類型為 Email，瀏覽器會自動驗證格式 */
                  className="form-control"
                  id="email"
                  name="email"
                  value={customerInfo.email}
                  onChange={onChange}
                />
              </div>
              {/* 電話號碼輸入框 */}
              <div className="mb-3">
                <label htmlFor="phone" className="form-label">
                  電話號碼:
                </label>
                <input
                  type="tel" /* 設定輸入類型為電話號碼，部分行動裝置可顯示數字鍵盤 */
                  className="form-control"
                  id="phone"
                  name="phone"
                  value={customerInfo.phone}
                  onChange={onChange}
                />
              </div>
              {/* 地址輸入框 */}
              <div className="mb-3">
                <label htmlFor="address" className="form-label">
                  地址:
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="address"
                  name="address"
                  value={customerInfo.address}
                  onChange={onChange}
                />
              </div>
              {/* 備註輸入區域 */}
              <div className="mb-3">
                <label htmlFor="textarea" className="form-label">
                  備註:
                </label>
                <textarea
                  className="form-control"
                  id="textarea"
                  name="note"
                  rows={3} /* 設定 textarea 顯示 3 行高 */
                  value={customerInfo.note}
                  onChange={onChange}
                />
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
