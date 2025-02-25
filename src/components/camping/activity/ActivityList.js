"use client";

// ===== 核心套件引入 =====
import Image from "next/image";            // Next.js 的圖片優化組件
import Link from "next/link";              // Next.js 的路由連結組件
import { useState, useEffect, useMemo } from "react";          // React 狀態管理
import { useRouter } from "next/navigation"; // Next.js 路由導航
import { useSession } from "next-auth/react"; // Next-Auth 會話管理
import useSWR from "swr";                    // SWR 數據請求管理
import { motion } from "framer-motion";
import { TbCampfire } from "react-icons/tb";
import Loading from "@/components/Loading";  // 添加 Loading 組件引入
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/pagination';

// ===== UI 圖標引入 =====
import {
  FaCalendarAlt,     // 日曆圖標
  FaMapMarkerAlt,    // 地標圖標
  FaHeart,           // 實心愛心圖標
  FaRegHeart,        // 空心愛心圖標
  FaShoppingCart,    // 購物車圖標
  FaStar,            // 星星圖標
  FaCampground,      // 露營圖標
  FaClock,           // 時鐘圖標
} from "react-icons/fa";

// ===== 日期處理引入 =====
import { format, differenceInDays } from "date-fns";         // 日期格式化工具
import { zhTW } from "date-fns/locale";    // 繁體中文語系

// ===== 自定義工具引入 =====
import {
  cartToast,           // 購物車相關提示
  favoriteToast,       // 收藏相關提示
  ToastContainerComponent, // Toast 容器組件
} from "@/utils/toast";

import { 
  showLoginAlert,      // 登入相關提示
  showSystemAlert      // 系統錯誤提示
} from "@/utils/sweetalert";

// ===== 組件定義 =====
export function ActivityList({ activities, viewMode, isLoading }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState({});        // 收藏按鈕載入狀態
  const [cartLoading, setCartLoading] = useState({}); // 購物車按鈕載入狀態

  // 使用 SWR 只獲取收藏狀態
  const { data: favoritesData, mutate: mutateFavorites } = useSWR(
    session ? "/api/camping/favorites" : null,
    (url) => fetch(url).then((res) => res.json())
  );

  // 將收藏資料轉換為物件格式
  const favorites = favoritesData?.favorites?.reduce((acc, id) => {
    acc[id] = true;
    return acc;
  }, {}) || {};

  // 使用傳入的 activities
  const displayActivities = activities || [];

  // 處理載入狀態
  if (isLoading) {
    return <Loading isLoading={isLoading} />;
  }

  // ===== 收藏相關處理 =====
  const handleLike = async (e, activityId) => {
    e.preventDefault();

    // 檢查登入狀態
    if (!session) {
      // 未登入 -> 使用 SweetAlert 提示登入
      const result = await showLoginAlert.warning();
      if (result.isConfirmed) {
        router.push("/auth/login");
      }
      return;
    }

    // 避免重複點擊
    if (loading[activityId]) return;
    setLoading((prev) => ({ ...prev, [activityId]: true }));

    try {
      const response = await fetch("/api/camping/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityId }),
      });

      if (!response.ok) {
        throw new Error("收藏操作失敗");
      }

      // 更新收藏狀態
      await mutateFavorites();

      // 根據操作結果顯示對應提示
      favorites[activityId]
        ? favoriteToast.removeSuccess()  // 取消收藏成功
        : favoriteToast.addSuccess();    // 加入收藏成功

      // 觸發收藏更新事件
      window.dispatchEvent(
        new CustomEvent("favoritesUpdate", {
          detail: { type: favorites[activityId] ? "remove" : "add" },
        })
      );
    } catch (error) {
      console.error("收藏操作:", error);
      favoriteToast.error("收藏操作失敗");
    } finally {
      setLoading((prev) => ({ ...prev, [activityId]: false }));
    }
  };

  // ===== 購物車相關處理 =====
  const handleAddToCart = async (e, activity) => {
    e.preventDefault();

    // 檢查登入狀態
    if (!session) {
      // 未登入 -> 使用 SweetAlert 提示登入
      const result = await showLoginAlert.warning();
      if (result.isConfirmed) {
        router.push("/auth/login");
      }
      return;
    }

    // 避免重複點擊
    if (cartLoading[activity.activity_id]) return;
    setCartLoading((prev) => ({ ...prev, [activity.activity_id]: true }));

    try {
      const response = await fetch("/api/camping/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityId: activity.activity_id,
          quantity: 1,
          totalPrice: 0,
          isQuickAdd: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // 根據錯誤類型選擇提示方式
        if (
          data.error.includes("庫存不足") ||
          data.error.includes("已在購物車") ||
          data.error.includes("數量限制")
        ) {
          // 一般操作錯誤 -> 使用 Toast
          cartToast.error(data.error);
          return;
        }

        // 系統錯誤 -> 使用 SweetAlert
        await showSystemAlert.error(data.error || "加入購物車失敗");
        return;
      }

      // 加入成功 -> 使用 Toast
      cartToast.addSuccess();
      
      // 觸發購物車更新事件
      window.dispatchEvent(
        new CustomEvent("cartUpdate", {
          detail: { type: "add" },
        })
      );
    } catch (error) {
      console.error("加入購物車失敗:", error);
      // 未預期的錯誤 -> 使用 SweetAlert
      await showSystemAlert.unexpectedError();
    } finally {
      setCartLoading((prev) => ({ ...prev, [activity.activity_id]: false }));
    }
  };

  // ===== 圖片處理相關 =====
  const getImageUrl = (imageName) => {
    return imageName
      ? `/uploads/activities/${imageName}`
      : "/images/default-activity.jpg";
  };

  // ===== 地址處理相關 =====
  const AddressDisplay = ({ address, city }) => {
    // 如果有城市資訊但地址未提供
    if (city && (!address || address === '地址未提供')) {
      return (
        <div className="flex items-center gap-1 text-gray-500">
          <FaMapMarkerAlt className="w-4 h-4" />
          <span>{city}</span>
        </div>
      );
    }

    // 如果地址完全未提供
    if (!address || address === '地址未提供') {
      return (
        <div className="flex items-center gap-1 text-gray-400 italic">
          <FaMapMarkerAlt className="w-4 h-4" />
          <span>地址未提供</span>
        </div>
      );
    }

    // 正常顯示地址
    return (
      <div className="flex items-center gap-1 text-gray-500">
        <FaMapMarkerAlt className="w-4 h-4" />
        <span>{address}</span>
      </div>
    );
  };

  // 容器動畫：控制整體淡入和子元素的依序出現
  const containerVariants = {
    hidden: { 
      opacity: 0,
    },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",  // 先執行容器動畫
        staggerChildren: 0.15,   // 子元素間隔
        delayChildren: 0.1,      // 容器動畫完成後的延遲
        duration: 0.3,           // 容器動畫時間
        ease: "easeOut"         // 平滑的緩動函數
      }
    }
  };

  // 項目動畫：從左側滑入並淡入
  const itemVariants = {
    hidden: { 
      x: -15,
      opacity: 0,
      filter: "blur(5px)"
    },
    visible: (index) => ({ 
      x: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        duration: 0.5,
        delay: index * 0.1, // 根據索引位置計算延遲
        ease: [0.25, 0.1, 0.25, 1.0], // 自定義貝塞爾曲線
      }
    })
  };

  // 移除 useMemo，直接判斷和渲染
  if (!displayActivities?.length) {
    return (
      <motion.div 
        className="flex flex-col items-center justify-center py-12 px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <TbCampfire className="w-24 h-24 text-[#B6AD9A] mb-4" />
        <div className="text-center space-y-3">
          <h3 className="text-xl font-medium text-[#5D564D]">
            目前沒有符合條件的活動
          </h3>
          <p className="text-[#8C8275]">
            試試調整篩選條件，或探索其他地區的精彩活動
          </p>
        </div>
      </motion.div>
    );
  }

  const formatPrice = (min, max) => {
    if (min === max) return [min];  // 返回單一價格
    return [min, max];  // 返回價格範圍
  };

  return (
    <div className="relative min-h-[200px]">
      <div className="relative">
        <Loading isLoading={isLoading} />
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className={`${isLoading ? 'opacity-50' : 'opacity-100'} 
                     transition-opacity duration-300`}
        >
          {viewMode === 'grid' ? (
            <>
              {/* 手機版 Swiper */}
              <div className="block sm:hidden -mx-4">
                <Swiper
                  modules={[FreeMode, Pagination]}
                  spaceBetween={16}
                  slidesPerView={'auto'}
                  loop={true}
                  freeMode={{
                    enabled: true,
                    momentum: true,
                  }}
                  pagination={{
                    clickable: true,
                    dynamicBullets: true,
                  }}
                  className="px-4 pb-8"
                >
                  {displayActivities.map((activity, index) => (
                    <SwiperSlide 
                      key={activity.activity_id}
                      className="w-[85%] max-w-[300px]"
                    >
                      <motion.div
                        custom={index}
                        variants={itemVariants}
                        className={`
                          bg-white/90 backdrop-blur-sm
                          rounded-xl overflow-hidden
                          group relative
                          shadow-lg hover:shadow-xl
                          transition-all duration-300
                          hover:bg-[#FAF7F2]
                          border border-[#E5E1DB]/30
                          transform-gpu
                        `}
                      >
                        <Link
                          href={`/camping/activities/${activity.activity_id}`}
                          className="block no-underline hover:no-underline"
                        >
                          <div className="absolute top-3 right-3 z-10 flex gap-2">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                handleAddToCart(e, activity);
                              }}
                              disabled={cartLoading[activity.activity_id]}
                              className="p-2 rounded-full 
                                       bg-white/90 backdrop-blur-sm
                                       shadow-lg
                                       transition-all duration-300
                                       hover:scale-110 active:scale-90
                                       hover:bg-white
                                       hover:shadow-[0_0_10px_rgba(182,173,154,0.3)]
                                       disabled:opacity-50 disabled:cursor-not-allowed
                                       group/cart"
                            >
                              <FaShoppingCart 
                                className={`w-4 h-4 
                                         ${cartLoading[activity.activity_id]
                                           ? 'text-gray-400'
                                           : 'text-[#8C8275] group-hover/cart:text-[#B6AD9A]'
                                         }`}
                              />
                            </button>

                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                handleLike(e, activity.activity_id);
                              }}
                              disabled={loading[activity.activity_id]}
                              className="p-2 rounded-full 
                                       bg-white/90 backdrop-blur-sm
                                       shadow-lg
                                       transition-all duration-300
                                       hover:scale-110 active:scale-90
                                       hover:bg-white
                                       hover:shadow-[0_0_10px_rgba(182,173,154,0.3)]
                                       disabled:opacity-50 disabled:cursor-not-allowed
                                       group/heart"
                            >
                              {favorites[activity.activity_id] ? (
                                <FaHeart className="w-4 h-4 text-[#FF6B6B]" />
                              ) : (
                                <FaRegHeart className="w-4 h-4 text-[#8C8275] 
                                                    group-hover/heart:text-[#FF6B6B]" />
                              )}
                            </button>
                          </div>

                          <div className="relative h-40 overflow-hidden rounded-t-xl">
                            <Image
                              src={getImageUrl(activity.main_image)}
                              alt={activity.activity_name}
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              className="object-cover transition-all duration-700 ease-out
                                       group-hover:scale-105"
                              priority={true}
                            />
                            <div className="absolute top-3 left-3">
                              <span className="px-2 py-1 text-xs bg-white/90 backdrop-blur-sm
                                            rounded-full text-[#8C8275] shadow-lg">
                                {activity.category_name || '一般露營'}
                              </span>
                            </div>
                            <div className="absolute bottom-3 left-3">
                              <span className="px-2 py-1 text-xs bg-[#4A3C31]/80 backdrop-blur-sm
                                            rounded-full text-white shadow-lg">
                                尚餘 {activity.available_spots || 0} 個營位
                              </span>
                            </div>
                          </div>

                          <div className="p-3 space-y-2.5">
                            <div className="space-y-1.5">
                              <div className="flex justify-between items-start gap-2">
                                <h3 className="text-lg font-medium text-[#4A3C31] line-clamp-1 mb-0
                                              group-hover:text-[#8C8275] transition-colors duration-300">
                                  {activity.activity_name}
                                </h3>
                                {activity.avg_rating && (
                                  <div className="flex items-center gap-1">
                                    <FaStar className="w-4 h-4 text-[#FFB800]" />
                                    <span className="text-sm font-medium text-[#8C8275]">
                                      {parseFloat(activity.avg_rating).toFixed(1)}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <p className="text-sm text-[#B6AD9A] line-clamp-1">
                                {activity.subtitle || "秋日的第一場露營"}
                              </p>
                            </div>

                            <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-1.5 text-sm text-[#7C7267]">
                                  <FaMapMarkerAlt className="w-4 h-4 text-[#B6AD9A] flex-shrink-0" />
                                  <span className="truncate">{activity.city}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 text-sm text-[#7C7267]">
                                <FaClock className="w-4 h-4 text-[#B6AD9A] flex-shrink-0" />
                                <span>{differenceInDays(
                                  new Date(activity.end_date),
                                  new Date(activity.start_date)
                                ) + 1} 天</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 text-sm text-[#7C7267]">
                              <FaCalendarAlt className="w-4 h-4 text-[#B6AD9A] flex-shrink-0" />
                              <div className="flex items-center gap-1">
                                <span>{format(new Date(activity.start_date), "yyyy/MM/dd")}</span>
                                <span className="text-[#B6AD9A]">~</span>
                                <span>{format(new Date(activity.end_date), "yyyy/MM/dd")}</span>
                              </div>
                            </div>

                            <div className="flex gap-1 overflow-x-auto scrollbar-hide">
                              {activity.options?.map((option) => (
                                <span 
                                  key={option.option_id}
                                  className="flex-shrink-0 inline-flex items-center gap-1
                                         px-1.5 py-0.5 rounded
                                         bg-[#F5F3F0] text-xs text-[#8C8275]"
                                >
                                  <FaCampground className="w-3 h-3" />
                                  <span>{option.spot_name}</span>
                                  <span className="text-[#B6AD9A]">•</span>
                                  <span>{option.people_per_spot}人</span>
                                </span>
                              ))}
                            </div>

                            <div className="flex justify-between items-center  border-t border-[#E5E1DB] pt-2">
                              <div className="space-y-0.5">
                                <p className="text-lg font-bold text-[#8C8275] flex items-center m-0">
                                  <span className="text-xs mr-1 mt-1">NT$</span>
                                  <span>{formatPrice(activity.min_price, activity.max_price).join('~')}</span>
                                </p>
                                <p className="text-xs text-[#B6AD9A]">每組活動</p>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleAddToCart(e, activity);
                                }}
                                className="px-3 py-1.5 rounded-lg
                                         bg-[#8C8275] text-white text-sm
                                         hover:bg-[#4A3C31]
                                         transition-colors duration-300"
                              >
                                立即預訂
                              </button>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>

              {/* 平板以上的網格佈局 */}
              <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {displayActivities.map((activity, index) => (
                  <motion.div
                    key={activity.activity_id}
                    custom={index}
                    variants={itemVariants}
                    className={`
                      bg-white/90 backdrop-blur-sm
                      rounded-xl overflow-hidden
                      group relative
                      shadow-lg hover:shadow-xl
                      transition-all duration-300
                      ${viewMode === 'grid' 
                        ? 'hover:-translate-y-1'
                        : 'hover:-translate-x-1'
                      }
                      hover:bg-[#FAF7F2]
                      border border-[#E5E1DB]/30
                      transform-gpu
                    `}
                  >
                    {viewMode === 'grid' ? (
                      <Link
                        href={`/camping/activities/${activity.activity_id}`}
                        className="block no-underline hover:no-underline"
                      >
                        <div className="absolute top-3 right-3 z-10 flex gap-2">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              handleAddToCart(e, activity);
                            }}
                            disabled={cartLoading[activity.activity_id]}
                            className="p-2 rounded-full 
                                     bg-white/90 backdrop-blur-sm
                                     shadow-lg
                                     transition-all duration-300
                                     hover:scale-110 active:scale-90
                                     hover:bg-white
                                     hover:shadow-[0_0_10px_rgba(182,173,154,0.3)]
                                     disabled:opacity-50 disabled:cursor-not-allowed
                                     group/cart"
                          >
                            <FaShoppingCart 
                              className={`w-4 h-4 
                                       ${cartLoading[activity.activity_id]
                                         ? 'text-gray-400'
                                         : 'text-[#8C8275] group-hover/cart:text-[#B6AD9A]'
                                       }`}
                            />
                          </button>

                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              handleLike(e, activity.activity_id);
                            }}
                            disabled={loading[activity.activity_id]}
                            className="p-2 rounded-full 
                                     bg-white/90 backdrop-blur-sm
                                     shadow-lg
                                     transition-all duration-300
                                     hover:scale-110 active:scale-90
                                     hover:bg-white
                                     hover:shadow-[0_0_10px_rgba(182,173,154,0.3)]
                                     disabled:opacity-50 disabled:cursor-not-allowed
                                     group/heart"
                          >
                            {favorites[activity.activity_id] ? (
                              <FaHeart className="w-4 h-4 text-[#FF6B6B]" />
                            ) : (
                              <FaRegHeart className="w-4 h-4 text-[#8C8275] 
                                                  group-hover/heart:text-[#FF6B6B]" />
                            )}
                          </button>
                        </div>

                        <div className="relative h-40 overflow-hidden rounded-t-xl">
                          <Image
                            src={getImageUrl(activity.main_image)}
                            alt={activity.activity_name}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover transition-all duration-700 ease-out
                                     group-hover:scale-105"
                            priority={true}
                          />
                          <div className="absolute top-3 left-3">
                            <span className="px-2 py-1 text-xs bg-white/90 backdrop-blur-sm
                                          rounded-full text-[#8C8275] shadow-lg">
                              {activity.category_name || '一般露營'}
                            </span>
                          </div>
                          <div className="absolute bottom-3 left-3">
                            <span className="px-2 py-1 text-xs bg-[#4A3C31]/80 backdrop-blur-sm
                                          rounded-full text-white shadow-lg">
                              尚餘 {activity.available_spots || 0} 個營位
                            </span>
                          </div>
                        </div>

                        <div className="p-3 space-y-2.5">
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-start gap-2">
                              <h3 className="text-lg font-medium text-[#4A3C31] line-clamp-1 mb-0
                                            group-hover:text-[#8C8275] transition-colors duration-300">
                                {activity.activity_name}
                              </h3>
                              {activity.avg_rating && (
                                <div className="flex items-center gap-1">
                                  <FaStar className="w-4 h-4 text-[#FFB800]" />
                                  <span className="text-sm font-medium text-[#8C8275]">
                                    {parseFloat(activity.avg_rating).toFixed(1)}
                                  </span>
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-[#B6AD9A] line-clamp-1">
                              {activity.subtitle || "秋日的第一場露營"}
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1.5 text-sm text-[#7C7267]">
                                <FaMapMarkerAlt className="w-4 h-4 text-[#B6AD9A] flex-shrink-0" />
                                <span className="truncate">{activity.city}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 text-sm text-[#7C7267]">
                              <FaClock className="w-4 h-4 text-[#B6AD9A] flex-shrink-0" />
                              <span>{differenceInDays(
                                new Date(activity.end_date),
                                new Date(activity.start_date)
                              ) + 1} 天</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 text-sm text-[#7C7267]">
                            <FaCalendarAlt className="w-4 h-4 text-[#B6AD9A] flex-shrink-0" />
                            <div className="flex items-center gap-1">
                              <span>{format(new Date(activity.start_date), "yyyy/MM/dd")}</span>
                              <span className="text-[#B6AD9A]">~</span>
                              <span>{format(new Date(activity.end_date), "yyyy/MM/dd")}</span>
                            </div>
                          </div>

                          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
                            {activity.options?.map((option) => (
                              <span 
                                key={option.option_id}
                                className="flex-shrink-0 inline-flex items-center gap-1
                                       px-1.5 py-0.5 rounded
                                       bg-[#F5F3F0] text-xs text-[#8C8275]"
                              >
                                <FaCampground className="w-3 h-3" />
                                <span>{option.spot_name}</span>
                                <span className="text-[#B6AD9A]">•</span>
                                <span>{option.people_per_spot}人</span>
                              </span>
                            ))}
                          </div>

                          <div className="flex justify-between items-center  border-t border-[#E5E1DB] pt-2">
                            <div className="space-y-0.5">
                              <p className="text-lg font-bold text-[#8C8275] flex items-center m-0">
                                <span className="text-xs mr-1 mt-1">NT$</span>
                                <span>{formatPrice(activity.min_price, activity.max_price).join('~')}</span>
                              </p>
                              <p className="text-xs text-[#B6AD9A]">每組活動</p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                handleAddToCart(e, activity);
                              }}
                              className="px-3 py-1.5 rounded-lg
                                       bg-[#8C8275] text-white text-sm
                                       hover:bg-[#4A3C31]
                                       transition-colors duration-300"
                            >
                              立即預訂
                            </button>
                          </div>
                        </div>
                      </Link>
                    ) : (
                      <Link
                        href={`/camping/activities/${activity.activity_id}`}
                        className="flex gap-6 p-3 no-underline hover:no-underline"
                      >
                        <div className="relative w-48 h-32 flex-shrink-0 self-center">
                          <Image
                            src={getImageUrl(activity.main_image)}
                            alt={activity.activity_name}
                            fill
                            className="object-cover rounded-lg"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-bold text-[#5D564D] mb-2">
                            {activity.activity_name}
                          </h3>
                          
                          <div className="flex items-center text-[#7C7267] mb-2">
                            <FaCalendarAlt className="w-4 h-4 mr-2" />
                            <span>
                              {format(new Date(activity.start_date), "yyyy/MM/dd")} - 
                              {format(new Date(activity.end_date), "yyyy/MM/dd")}
                            </span>
                          </div>

                          <div className="flex items-center text-[#7C7267] mb-4">
                            <AddressDisplay 
                              address={activity.camp_address} 
                              city={activity.city} 
                            />
                          </div>

                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-xl font-bold text-[#8C8275] flex items-center">
                                <span className="text-sm mr-1">NT</span>
                                <span>$ {formatPrice(activity.min_price, activity.max_price).join(' ~ ')}</span>
                              </p>
                              <p className="text-sm text-[#B6AD9A]">
                                尚餘 {activity.available_spots || 0} 個營位
                              </p>
                            </div>
                            
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleAddToCart(e, activity);
                                }}
                                disabled={cartLoading[activity.activity_id]}
                                className="p-2 rounded-full 
                                         bg-white/90 backdrop-blur-sm
                                         shadow-lg
                                         transition-all duration-300
                                         hover:scale-110 active:scale-90
                                         hover:bg-white
                                         hover:shadow-[0_0_10px_rgba(182,173,154,0.3)]
                                         disabled:opacity-50 disabled:cursor-not-allowed
                                         group/cart"
                              >
                                <FaShoppingCart 
                                  className={`w-4 h-4 
                                           ${cartLoading[activity.activity_id]
                                             ? 'text-gray-400'
                                             : 'text-[#8C8275] group-hover/cart:text-[#B6AD9A]'
                                           }`}
                                />
                              </button>

                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleLike(e, activity.activity_id);
                                }}
                                disabled={loading[activity.activity_id]}
                                className="p-2 rounded-full 
                                         bg-white/90 backdrop-blur-sm
                                         shadow-lg
                                         transition-all duration-300
                                         hover:scale-110 active:scale-90
                                         hover:bg-white
                                         hover:shadow-[0_0_10px_rgba(182,173,154,0.3)]
                                         disabled:opacity-50 disabled:cursor-not-allowed
                                         group/heart"
                              >
                                {favorites[activity.activity_id] ? (
                                  <FaHeart className="w-4 h-4 text-[#FF6B6B]" />
                                ) : (
                                  <FaRegHeart className="w-4 h-4 text-[#8C8275] 
                                              group-hover/heart:text-[#FF6B6B]" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </Link>
                    )}
                  </motion.div>
                ))}
              </div>
            </>
          ) : (
            <motion.div 
              className="space-y-3"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {displayActivities.map((activity, index) => (
                <motion.div
                  key={activity.activity_id}
                  variants={itemVariants}
                  custom={index}
                >
                  <Link
                    href={`/camping/activities/${activity.activity_id}`}
                    className="flex gap-4 p-3 no-underline hover:no-underline bg-white/90 backdrop-blur-sm 
                              rounded-xl hover:bg-[#FAF7F2] transition-all duration-300 
                              border border-[#E5E1DB]/30 shadow-sm hover:shadow-md"
                  >
                    {/* 左側圖片 */}
                    <div className="relative w-24 h-24 flex-shrink-0 self-center rounded-lg overflow-hidden">
                      <Image
                        src={getImageUrl(activity.main_image)}
                        alt={activity.activity_name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* 右側內容 */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      {/* 上半部：標題和基本資訊 */}
                      <div>
                        {/* 標題和副標題區 */}
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-base font-medium text-[#4A3C31] m-0 line-clamp-1">
                            {activity.activity_name}
                          </h3>
                          <div className="flex items-center gap-3">
                            <span className="text-[#B6AD9A]">|</span>
                            <span className="text-sm text-[#B6AD9A] line-clamp-1">
                              {activity.subtitle || "秋日的第一場露營"}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-1 text-sm text-[#7C7267]">
                          <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex items-center gap-1">
                              <FaMapMarkerAlt className="w-3.5 h-3.5 text-[#B6AD9A]" />
                              <span>{activity.city}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <FaClock className="w-3.5 h-3.5 text-[#B6AD9A]" />
                              <span>{differenceInDays(
                                new Date(activity.end_date),
                                new Date(activity.start_date)
                              ) + 1} 天</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <FaCalendarAlt className="w-3.5 h-3.5 text-[#B6AD9A]" />
                            <span>
                              {format(new Date(activity.start_date), "yyyy/MM/dd")}
                              <span className="text-[#B6AD9A] mx-1">~</span>
                              {format(new Date(activity.end_date), "yyyy/MM/dd")}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 下半部：價格和操作按鈕 */}
                      <div className="flex justify-between items-center mt-2 border-t border-[#E5E1DB] pt-1">
                        <div className="flex items-center gap-2">
                          <p className="text-base font-bold text-[#8C8275] flex items-center m-0">
                            <span className="text-xs mr-1 mt-1">NT$</span>
                            <span>{formatPrice(activity.min_price, activity.max_price).join('~')}</span>
                          </p>
                          <span className="text-xs text-[#B6AD9A]">
                            · 尚餘 {activity.available_spots || 0} 個營位
                          </span>
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              handleAddToCart(e, activity);
                            }}
                            className="p-1.5 rounded-full bg-white/90 backdrop-blur-sm shadow-sm
                                     hover:shadow-md transition-all duration-300"
                          >
                            <FaShoppingCart className="w-4 h-4 text-[#8C8275]" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              handleLike(e, activity.activity_id);
                            }}
                            className="p-1.5 rounded-full bg-white/90 backdrop-blur-sm shadow-sm
                                     hover:shadow-md transition-all duration-300"
                          >
                            {favorites[activity.activity_id] ? (
                              <FaHeart className="w-4 h-4 text-[#FF6B6B]" />
                            ) : (
                              <FaRegHeart className="w-4 h-4 text-[#8C8275]" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>
      <ToastContainerComponent />
    </div>
  );
}
