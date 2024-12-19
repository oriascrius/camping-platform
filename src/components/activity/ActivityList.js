'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { FaCalendarAlt, FaMapMarkerAlt, FaHeart, FaRegHeart, FaShoppingCart } from 'react-icons/fa';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export function ActivityList({ activities }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [favorites, setFavorites] = useState({});
  const [loading, setLoading] = useState({});
  const [cartLoading, setCartLoading] = useState({});

  // 檢查初始收藏狀態
  useEffect(() => {
    const checkFavorites = async () => {
      try {
        const response = await fetch('/api/favorites');
        const data = await response.json();
        
        if (data.favorites) {
          const favMap = {};
          data.favorites.forEach(id => {
            favMap[id] = true;
          });
          setFavorites(favMap);
        }
      } catch (error) {
        console.error('檢查收藏狀態失敗:', error);
      }
    };

    if (session) {
      checkFavorites();
    }
  }, [session]);

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
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ activityId })
      });

      if (!response.ok) throw new Error('收藏操作失敗');

      const data = await response.json();

      // 更新本地收藏狀態
      const isCurrentlyFavorited = favorites[activityId];
      setFavorites(prev => ({
        ...prev,
        [activityId]: !prev[activityId]
      }));

      // 觸發自定義事件來更新導航欄的收藏數量
      const event = new CustomEvent('favoritesUpdate', {
        detail: { type: isCurrentlyFavorited ? 'remove' : 'add' }
      });
      window.dispatchEvent(event);

      toast.success(data.message, {
        position: "top-center",
        autoClose: 1000,
      });

    } catch (error) {
      console.error('收藏操作���:', error);
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

    // 檢查是否有可用選項
    if (!activity.default_option_id) {
      toast.error('此活動暫無可用選項');
      return;
    }

    setCartLoading(prev => ({ ...prev, [activity.activity_id]: true }));

    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activityId: activity.activity_id,
          optionId: activity.default_option_id, // 使用默認選項ID
          quantity: 1
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '加入購物車失敗');
      }

      // 觸發購物車更新事件
      window.dispatchEvent(new CustomEvent('cartUpdate'));
      
      toast.success('已加入購物車');

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
        <div key={activity.activity_id} className="bg-white rounded-lg shadow-md overflow-hidden relative">
          {/* 收藏和購物車按鈕 */}
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            <button
              onClick={(e) => handleAddToCart(e, activity)}
              disabled={cartLoading[activity.activity_id]}
              className={`p-2 rounded-full bg-white shadow-md 
                ${cartLoading[activity.activity_id] ? 'opacity-50' : 'hover:bg-gray-100'}`}
            >
              <FaShoppingCart className={`w-5 h-5 ${cartLoading[activity.activity_id] ? 'text-gray-400' : 'text-gray-600'}`} />
            </button>
            <button
              onClick={(e) => handleLike(e, activity.activity_id)}
              disabled={loading[activity.activity_id]}
              className={`p-2 rounded-full bg-white shadow-md 
                ${loading[activity.activity_id] ? 'opacity-50' : 'hover:bg-gray-100'}`}
            >
              {favorites[activity.activity_id] ? (
                <FaHeart className="w-5 h-5 text-red-500" />
              ) : (
                <FaRegHeart className="w-5 h-5 text-gray-600 hover:text-red-500" />
              )}
            </button>
          </div>

          <Link href={`/activities/${activity.activity_id}`} className="block">
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
                <span className="text-sm text-gray-500">
                  <FaCalendarAlt className="inline mr-1" />
                  {format(new Date(activity.start_date), 'yyyy/MM/dd', { locale: zhTW })}
                  {' - '}
                  {format(new Date(activity.end_date), 'yyyy/MM/dd', { locale: zhTW })}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{activity.activity_name}</h3>
              <div className="flex items-center text-gray-600 mb-2">
                <FaMapMarkerAlt className="mr-2" />
                <span className="text-sm line-clamp-1">{activity.location}</span>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-lg font-bold text-green-600">
                    NT$ {activity.min_price?.toLocaleString()}
                    {activity.min_price !== activity.max_price && 
                      ` ~ ${activity.max_price?.toLocaleString()}`
                    }
                  </p>
                  <p className="text-sm text-gray-500">尚餘 {activity.total_spots} 個名額</p>
                </div>
                <span className="inline-flex items-center p-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
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