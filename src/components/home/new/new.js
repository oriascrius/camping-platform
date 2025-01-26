"use client";
import { Swiper, SwiperSlide } from "swiper/react";

  // import "@/node_modules/bootstrap/dist/css/bootstrap.min.css";
  // import "@/node_modules/bootstrap/dist/js/bootstrap.bundle.min.js";
// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

import { Autoplay, Pagination } from "swiper/modules";

export default function New() {
  return(
  <>
    <section className="new">
          <h2
            className="title-style text-center"
            data-aos="fade-down"
            data-aos-easing="ease-in-out"
            data-aos-duration="700"
          >
            最新活動資訊
          </h2>
          <article className="bg" />
          <article
            className="new-main"
            data-aos="fade-left"
            data-aos-easing="ease-in-out"
            data-aos-duration={700}
          >
            <Swiper
              modules={[Autoplay, Pagination]} // 注册所需模块
              spaceBetween={97} // 每个滑块之间的距离
              slidesPerView={3.5} // 一次显示一个滑块
              centeredSlides={false} // 居中显示
              loop={true} // 循环
              autoplay={{
                delay: 2500,
                disableOnInteraction: false,
              }}
              className="mySwiper new-swiper "
            >
              <SwiperSlide>
                <a href="#">
                  <div className="image">
                    <img src="/images/index/image8.jpg" alt="img" />
                  </div>
                  <p>3 人露營帳篷 MH100 Fresh</p>
                </a>
              </SwiperSlide>
              <SwiperSlide>
                <a href="#">
                  <div className="image">
                    <img src="/images/index/image9.jpg" alt="img" />
                  </div>
                  <p>3 人露營帳篷 MH100 Fresh</p>
                </a>
              </SwiperSlide>
              <SwiperSlide>
                <a href="#">
                  <div className="image">
                    <img src="/images/index/image10.jpg" alt="img" />
                  </div>
                  <p>3 人露營帳篷 MH100 Fresh</p>
                </a>
              </SwiperSlide>
              <SwiperSlide>
                <a href="#">
                  <div className="image">
                    <img src="/images/index/image8.jpg" alt="img" />
                  </div>
                  <p>3 人露營帳篷 MH100 Fresh</p>
                </a>
              </SwiperSlide>
              <SwiperSlide>
                <a href="#">
                  <div className="image">
                    <img src="/images/index/image9.jpg" alt="img" />
                  </div>
                  <p>3 人露營帳篷 MH100 Fresh</p>
                </a>
              </SwiperSlide>
              <SwiperSlide>
                <a href="#">
                  <div className="image">
                    <img src="/images/index/image10.jpg" alt="img" />
                  </div>
                  <p>3 人露營帳篷 MH100 Fresh</p>
                </a>
              </SwiperSlide>
              <SwiperSlide>
                <a href="#">
                  <div className="image">
                    <img src="/images/index/image9.jpg" alt="img" />
                  </div>
                  <p>3 人露營帳篷 MH100 Fresh</p>
                </a>
              </SwiperSlide>
            </Swiper>
          </article>
        </section>
  </>
  )
}