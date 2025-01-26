"use client";

export default function QnA() {
    return(
        <>
            <section className="d-flex fa">
          <h2
            className="title-style text-center"
            data-aos="fade-down"
            data-aos-easing="linear"
            data-aos-duration={700}
          >
            Q&amp;A
          </h2>
          <div className="FQA-main container">
            <div
              className="left-item"
              data-aos="fade-right"
              data-aos-easing="linear"
              data-aos-duration={700}
            >
              <form>
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">
                    姓名:
                  </label>
                  <input
                    type="text"
                    className="form-control focus-ring"
                    id="name"
                    aria-describedby="emailHelp"
                    placeholder="請輸入姓名"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="tel" className="form-label">
                    電話:
                  </label>
                  <input
                    type="tel"
                    className="form-control focus-ring"
                    id="tel"
                    aria-describedby="emailHelp"
                    placeholder="請輸入電話"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    Email:
                  </label>
                  <input
                    type="email"
                    className="form-control focus-ring"
                    id="email"
                    aria-describedby="emailHelp"
                    placeholder="請輸入信箱"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="address" className="form-label">
                    地址:
                  </label>
                  <input
                    type="text"
                    className="form-control focus-ring"
                    id="address"
                    aria-describedby="emailHelp"
                    placeholder="請輸入地址"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="other" className="form-label">
                    其他:
                  </label>
                  <textarea
                    type="text"
                    className="form-control focus-ring"
                    id="other"
                    aria-describedby="emailHelp"
                    placeholder="請輸入信箱"
                    rows={4}
                    cols={50}
                    defaultValue={"                            "}
                  />
                </div>
                <button type="submit" className="submit btn btn-primary">
                  送出
                </button>
              </form>
            </div>
            <div
              className="right-item"
              data-aos="fade-left"
              data-aos-easing="linear"
              data-aos-duration={700}
            >
              <img src="/images/index/fa-bg.jpg" alt="img" />
            </div>
          </div>
        </section>
        </>
    )
}