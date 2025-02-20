'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import { CalendarOutlined, EnvironmentOutlined, TeamOutlined } from '@ant-design/icons';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export default function RelatedActivities({ currentActivityId }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedActivities = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/camping/activities/featured');
        const data = await response.json();
        
        // 過濾掉當前活動
        const filteredActivities = data.activities.filter(
          activity => activity.activity_id !== parseInt(currentActivityId)
        );
        setActivities(filteredActivities);
      } catch (error) {
        console.error('獲取精選活動失敗:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedActivities();
  }, [currentActivityId]);

  if (loading) {
    return (
      <div className="py-8 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">精選活動</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="bg-white rounded-lg shadow-md h-[300px] animate-pulse">
                <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="py-8 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">精選活動</h2>
          <div className="text-center text-gray-500">目前沒有其他精選活動</div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">精選活動</h2>
        <div className="relative">
          <Swiper
            modules={[Autoplay, Navigation, Pagination]}
            spaceBetween={20}
            slidesPerView={1}
            navigation
            pagination={{ clickable: true }}
            autoplay={{
              delay: 5000,
              disableOnInteraction: false,
            }}
            breakpoints={{
              480: { slidesPerView: 1, spaceBetween: 20 },
              640: { slidesPerView: 2, spaceBetween: 20 },
              768: { slidesPerView: 3, spaceBetween: 20 },
              1024: { slidesPerView: 4, spaceBetween: 20 }
            }}
            className="w-full pb-12"
          >
            {activities.map((activity) => (
              <SwiperSlide key={activity.activity_id}>
                <Link 
                  href={`/camping/activities/${activity.activity_id}`}
                  className="block group no-underline"
                >
                  <div className="bg-white rounded-lg overflow-hidden">
                    <div className="relative h-48">
                      <Image
                        src={`/uploads/activities/${activity.main_image}`}
                        alt={activity.activity_name || '活動圖片'}
                        fill
                        sizes="(max-width: 480px) 100vw, (max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                        style={{ objectFit: 'cover' }}
                        className="group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 right-2 bg-green-600 text-white px-3 py-1 text-sm rounded-full">
                        精選活動
                      </div>
                      <div className="absolute bottom-2 left-2 bg-white/90 px-3 py-1 rounded-full">
                        <span className="text-green-600 font-medium">
                          NT$ {activity.min_price?.toLocaleString()} 起
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="text-xl font-bold text-gray-800 mb-3">
                        {activity.activity_name}
                      </h3>
                      <div className="flex items-center mb-2 text-gray-600">
                        <EnvironmentOutlined className="mr-2" />
                        <span className="text-sm">
                          {activity.camp_name}
                        </span>
                      </div>
                      <div className="flex items-center mb-2 text-gray-600">
                        <CalendarOutlined className="mr-2" />
                        <span className="text-sm">
                          {format(new Date(activity.start_date), 'MM/dd', { locale: zhTW })} - 
                          {format(new Date(activity.end_date), 'MM/dd', { locale: zhTW })}
                        </span>
                      </div>
                      <div className="flex items-center mb-4 text-gray-600">
                        <TeamOutlined className="mr-2" />
                        <span className="text-sm">
                          剩餘名額：{activity.total_spots || '確認中'}
                        </span>
                      </div>
                      <button className="w-full py-2 bg-green-600 text-white rounded-full 
                                       hover:bg-green-700 transition-colors duration-300">
                        立即報名
                      </button>
                    </div>
                  </div>
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </div>
  );
} 