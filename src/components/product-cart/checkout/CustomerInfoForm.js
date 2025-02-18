import { useEffect } from "react";

export default function CustomerInfoForm({
  customerInfo,
  onChange,
  shippingAddress,
  setCustomerInfo, // ✨ 確保能夠更新父層的 customerInfo
}) {
  useEffect(() => {
    // ✅ 當 `shippingAddress` 有變化，更新 `customerInfo.address`
    if (shippingAddress) {
      setCustomerInfo((prev) => ({
        ...prev,
        address: shippingAddress,
      }));
    }
  }, [shippingAddress, setCustomerInfo]);

  return (
    <section className="customer-information">
      <div className="container">
        <div className="main">
          <article className="title">
            <h3>訂購資料</h3>
          </article>
          <article className="content">
            <div className="item-content">
              <div className="mb-3">
                <label htmlFor="name" className="form-label">
                  收件人名稱:
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="name"
                  name="name"
                  value={customerInfo.name}
                  onChange={onChange}
                />
              </div>

              <div className="mb-3">
                <label htmlFor="email" className="form-label">
                  電子信箱:
                </label>
                <input
                  type="email"
                  className="form-control"
                  id="email"
                  name="email"
                  value={customerInfo.email}
                  onChange={onChange}
                />
              </div>

              <div className="mb-3">
                <label htmlFor="phone" className="form-label">
                  電話號碼:
                </label>
                <input
                  type="tel"
                  className="form-control"
                  id="phone"
                  name="phone"
                  value={customerInfo.phone}
                  onChange={onChange}
                />
              </div>

              <div className="mb-3">
                <label htmlFor="address" className="form-label">
                  寄送地址:
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="address"
                  name="address"
                  value={customerInfo.address} // ✅ 這次確保填入的是 `customerInfo.address`
                  onChange={onChange}
                />
              </div>

              <div className="mb-3">
                <label htmlFor="textarea" className="form-label">
                  備註:
                </label>
                <textarea
                  className="form-control"
                  id="textarea"
                  name="note"
                  rows={3}
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
