"use client";
import { Swiper, SwiperSlide } from "swiper/react";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

import { Autoplay, Pagination } from "swiper/modules";

export default function ProductSlider() {
  return (
    <>
      <section className="d-flex product">
        <h2 className="title-style text-center">熱門商品</h2>
        <article className="product-main">
          <Swiper
            modules={[Autoplay, Pagination]} // 注册所需模块
            spaceBetween={73} // 每个滑块之间的距离
            slidesPerView={4} // 一次显示一个滑块
            centeredSlides={false} // 居中显示
            loop={true} // 循环
            autoplay={{
              delay: 2500,
              disableOnInteraction: false,
            }}
            pagination={{ clickable: true }} // 启用分页
            className="mySwiper about-swiper"
          >
            <SwiperSlide>
              <a href="#">
                <span className="item">
                  <div className="image">
                    <img src="/images/index/image 21.jpg" alt="img" />
                  </div>
                  <h3 className="title">3 人露營帳篷 MH100 Fresh</h3>
                  <p className="price">
                    $<span>2,999</span>
                  </p>
                </span>
              </a>
            </SwiperSlide>
            <SwiperSlide>
              <a href="#">
                <span className="item">
                  <div className="image">
                    <img src="/images/index/image 22.jpg" alt="img" />
                  </div>
                  <h3 className="title">3 人露營帳篷 MH100 Fresh</h3>
                  <p className="price">
                    $<span>2,999</span>
                  </p>
                </span>
              </a>
            </SwiperSlide>
            <SwiperSlide>
              <a href="#">
                <span className="item">
                  <div className="image">
                    <img src="/images/index/image 63.jpg" alt="img" />
                  </div>
                  <h3 className="title">4 人露營穿骨快開帳篷 Arpenaz</h3>
                  <p className="price">
                    $<span>1,499</span>
                  </p>
                </span>
              </a>
            </SwiperSlide>
            <SwiperSlide>
              <a href="#">
              <span className="item">
                <div className="image">
                  <img src="/images/index/image 65.jpg" alt="img" />
                </div>
                <h3 className="title">3 人露營帳篷 MH100 Fresh</h3>
                <p className="price">
                  $<span>2,999</span>
                </p>
                </span>
              </a>
            </SwiperSlide>
            <SwiperSlide>
              <a href="#">
              <span className="item">
                <div className="image">
                  <img src="/images/index/image 65.jpg" alt="img" />
                </div>
                <h3 className="title">3 人露營帳篷 MH100 Fresh</h3>
                <p className="price">
                  $<span>2,999</span>
                </p>
                </span>
              </a>
            </SwiperSlide>
          </Swiper>
          {/* <div className="product-slider">
            <div className="product-item">
              <a href="#" data-aos="fade-up">
                <span className="item">
                  <div className="image">
            {/* <div className="swiper about-swiper">
              <div className="swiper-wrapper">
                <div className="swiper-slide">
                  <a href="#" data-aos="fade-up">
                    <span className="item">
                      <div className="image">
                        <img src="/images/index/image 21.jpg" alt="img" />
                      </div>
                      <h3 className="title">3 人露營帳篷 MH100 Fresh</h3>
                      <p className="price">
                        $<span>2,999</span>
                      </p>
                    </span>
                  </a>
                </div>
                <div className="swiper-slide">
                  <a href="#" data-aos="fade-up">
                    <span className="item">
                      <div className="image">
                        <img src="/images/index/image 22.jpg" alt="img" />
                      </div>
                      <h3 className="title">3 人露營帳篷 MH100 Fresh</h3>
                      <p className="price">
                        $<span>2,999</span>
                      </p>
                    </span>
                  </a>
                </div>
                <div className="swiper-slide">
                  <a href="#" data-aos="fade-up">
                    <span className="item">
                      <div className="image">
                        <img src="/images/index/image 63.jpg" alt />
                      </div>
                      <h3 className="title">4 人露營穿骨快開帳篷 Arpenaz</h3>
                      <p className="price">
                        $<span>1,499</span>
                      </p>
                    </span>
                  </a>
                </div>
                <div className="swiper-slide">
                  <a href="#" data-aos="fade-up">
                    <span className="item">
                      <div className="image">
                        <img src="/images/index/image 65.jpg" alt />
                      </div>
                      <h3 className="title">3 人露營帳篷 MH100 Fresh</h3>
                      <p className="price">
                        $<span>2,999</span>
                      </p>
                    </span>
                  </a>
                </div>
                <div className="swiper-slide">
                  <a href="#" data-aos="fade-up">
                    <span className="item">
                      <div className="image">
                        <img src="/images/index/image 65.jpg" alt />
                      </div>
                      <h3 className="title">3 人露營帳篷 MH100 Fresh</h3>
                      <p className="price">
                        $<span>2,999</span>
                      </p>
                    </span>
                  </a>
                </div>
              </div>
              <div className="swiper-pagination" />
            </div> */}
        </article>
      </section>
    </>
  );
}
