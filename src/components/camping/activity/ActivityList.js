'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { FaCalendarAlt, FaMapMarkerAlt, FaHeart, FaRegHeart, FaShoppingCart } from 'react-icons/fa';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';

export function ActivityList() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState({});
  const [cartLoading, setCartLoading] = useState({});

  // 使用 SWR 獲取活動列表
  const { data, error: activitiesError } = useSWR(
    '/api/camping/activities',
    url => fetch(url).then(res => res.json())
  );

  // 使用 SWR 獲取收藏狀態
  const { data: favoritesData, mutate: mutateFavorites } = useSWR(
    session ? '/api/camping/favorites' : null,
    url => fetch(url).then(res => res.json())
  );

  // 處理收藏狀態
  const favorites = favoritesData?.favorites?.reduce((acc, id) => {
    acc[id] = true;
    return acc;
  }, {}) || {};

  // 從 data 中取出 activities 陣列
  const activities = data?.activities || [];

  // 處理載入和錯誤狀態
  if (activitiesError) return <div>載入失敗</div>;
  if (!data) return <div>載入中...</div>;

  const handleLike = async (e, activityId) => {
    e.preventDefault();
    
    if (!session) {
      toast.error('請先登入');
      router.push('/auth/login');
      return;
    }

    if (loading[activityId]) return;
    setLoading(prev => ({ ...prev, [activityId]: true }));
    
    try {
      const response = await fetch('/api/camping/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ activityId })
      });

      if (!response.ok) throw new Error('收藏操作失敗');

      // 使用 SWR 的 mutate 來更新收藏狀態
      await mutateFavorites();

      const data = await response.json();
      toast.success(data.message, {
        position: "top-center",
        autoClose: 1000,
      });

      // 觸發導航欄更新
      window.dispatchEvent(new CustomEvent('favoritesUpdate', {
        detail: { type: favorites[activityId] ? 'remove' : 'add' }
      }));

    } catch (error) {
      console.error('收藏操作:', error);
      toast.error('收藏操作失敗');
    } finally {
      setLoading(prev => ({ ...prev, [activityId]: false }));
    }
  };

  const handleAddToCart = async (e, activity) => {
    e.preventDefault();
    
    if (!session) {
      toast.error('請先登入');
      router.push('/auth/login');
      return;
    }

    if (cartLoading[activity.activity_id]) return;

    setCartLoading(prev => ({ ...prev, [activity.activity_id]: true }));

    try {
      const response = await fetch('/api/camping/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activityId: activity.activity_id,
          quantity: 1,
          totalPrice: 0,
          isQuickAdd: true
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '加入購物車失敗');
      }

      toast.success('已加入購物車！', {
        position: "top-center",
        autoClose: 1000,
      });

      window.dispatchEvent(new CustomEvent('cartUpdate', {
        detail: { type: 'add' }
      }));

    } catch (error) {
      console.error('加入購物車失敗:', error);
      toast.error(error.message);
    } finally {
      setCartLoading(prev => ({ ...prev, [activity.activity_id]: false }));
    }
  };

  const getImageUrl = (imageName) => {
    return imageName ? `/uploads/activities/${imageName}` : '/images/default-activity.jpg';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {activities.map(activity => (
        <div key={activity.activity_id} className="bg-white rounded-[var(--border-radius-lg)] shadow-md overflow-hidden relative">
          {/* 收藏和購物車按鈕 */}
          <div className="absolute top-4 right-4 z-1 flex gap-2">
            <button
              onClick={(e) => handleAddToCart(e, activity)}
              disabled={cartLoading[activity.activity_id]}
              className={`p-2 rounded-full bg-white shadow-md 
                ${cartLoading[activity.activity_id] ? 'opacity-50' : 'hover:bg-[var(--gray-7)]'}`}
            >
              <FaShoppingCart className={`w-5 h-5 ${cartLoading[activity.activity_id] ? 'text-[var(--gray-5)]' : 'text-[var(--gray-3)]'}`} />
            </button>
            <button
              onClick={(e) => handleLike(e, activity.activity_id)}
              disabled={loading[activity.activity_id]}
              className={`p-2 rounded-full bg-white shadow-md 
                ${loading[activity.activity_id] ? 'opacity-50' : 'hover:bg-[var(--gray-7)]'}`}
            >
              {favorites[activity.activity_id] ? (
                <FaHeart className="w-5 h-5 text-[var(--status-error)]" />
              ) : (
                <FaRegHeart className="w-5 h-5 text-[var(--gray-3)] hover:text-[var(--status-error)]" />
              )}
            </button>
          </div>

          <Link 
            href={`/camping/activities/${activity.activity_id}`} 
            className="block no-underline hover:no-underline"
          >
            <div className="relative h-48 mb-4">
              <Image
                src={getImageUrl(activity.main_image)}
                alt={activity.activity_name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover rounded-lg"
                priority={true}
              />
              {!activity.is_active && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <span className="text-white text-lg font-bold">已結束</span>
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[var(--gray-4)]">
                  <FaCalendarAlt className="inline mr-1" />
                  {format(new Date(activity.start_date), 'yyyy/MM/dd', { locale: zhTW })}
                  {' - '}
                  {format(new Date(activity.end_date), 'yyyy/MM/dd', { locale: zhTW })}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-[var(--gray-1)] mb-1">
                {activity.activity_name}
              </h3>
              <div className="flex items-center text-[var(--gray-3)] mb-2">
                <FaMapMarkerAlt className="mr-2 text-[var(--primary)]" />
                <span className="text-sm font-medium line-clamp-1">
                  {activity.camp_address || '地址未提供'}
                </span>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-lg font-bold text-[var(--primary)]">
                    NT$ {activity.min_price?.toLocaleString()}
                    {activity.min_price !== activity.max_price && 
                      ` ~ ${activity.max_price?.toLocaleString()}`
                    }
                  </p>
                  <p className="text-sm text-[var(--gray-4)]">
                    尚餘 {activity.total_spots} 個名額
                  </p>
                </div>
                <span className="inline-flex items-center p-2 border border-transparent text-sm font-medium rounded-[var(--border-radius-md)] shadow-sm text-white bg-[var(--primary)] hover:bg-[var(--secondary-4)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)]">
                  查看更多
                </span>
              </div>
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
} 