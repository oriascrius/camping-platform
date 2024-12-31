'use client';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import StarRating from './StarRating';
// 引入必要的樣式
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export default function DiscussionCarousel({ discussions }) {
  if (!discussions?.length) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 mb-8">
      <h3 className="text-xl font-semibold mb-4">最新評論</h3>
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        spaceBetween={20}
        slidesPerView={3}
        navigation
        pagination={{ clickable: true }}
        autoplay={{
          delay: 3000,
          pauseOnMouseEnter: true,
        }}
        breakpoints={{
          320: { slidesPerView: 1 },
          768: { slidesPerView: 2 },
          1024: { slidesPerView: 3 }
        }}
        className="discussion-swiper"
      >
        {discussions.map((discussion) => (
          <SwiperSlide key={discussion.id}>
            <div className="bg-white rounded-lg shadow p-4 h-[200px] flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium truncate">
                  {discussion.user_name}
                </h4>
                <time className="text-sm text-gray-500">
                  {new Date(discussion.created_at).toLocaleDateString()}
                </time>
              </div>
              <div className="mb-2">
                <StarRating value={discussion.rating} readOnly />
              </div>
              <p className="text-gray-700 line-clamp-4 flex-1">
                {discussion.content}
              </p>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
} 