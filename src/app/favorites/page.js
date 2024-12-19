"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { FaCalendarAlt, FaMapMarkerAlt, FaHeart } from "react-icons/fa";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { toast } from "react-toastify";

export default function FavoritesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      router.push("/auth/login");
      return;
    }

    const fetchFavorites = async () => {
      try {
        // 先獲取收藏的活動ID列表
        const favResponse = await fetch("/api/favorites");
        const favData = await favResponse.json();

        if (!favData.favorites?.length) {
          setFavorites([]);
          setLoading(false);
          return;
        }

        // 獲取收藏活動的詳細資訊
        const activitiesResponse = await fetch("/api/activities/favorites", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            activityIds: favData.favorites,
          }),
        });
        const activitiesData = await activitiesResponse.json();
        setFavorites(activitiesData.activities || []);
      } catch (error) {
        console.error("獲取收藏失敗:", error);
        toast.error("獲取收藏失敗");
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [session, router]);

  const handleRemoveFavorite = async (activityId) => {
    try {
      const response = await fetch("/api/favorites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ activityId }),
      });

      if (!response.ok) throw new Error("移除收藏失敗");

      // 更新本地狀態
      setFavorites((prev) =>
        prev.filter((fav) => fav.activity_id !== activityId)
      );
      
      // 觸發全域事件，通知其他組件收藏已更新
      window.dispatchEvent(new CustomEvent('favoritesUpdate', {
        detail: { type: 'remove' }
      }));
      
      toast.success("已移除收藏");
    } catch (error) {
      console.error("移除收藏失敗:", error);
      toast.error("移除收藏失敗");
    }
  };

  const getImageUrl = (imageName) => {
    // 如果是完整的 URL（包括 http:// 或 https:// 開頭）
    if (imageName?.startsWith('http')) {
      return imageName;
    }
    
    // 如果有圖片名稱但不是完整 URL
    if (imageName) {
      try {
        // 確保圖片路徑正確（活動圖片存放在 activities 子目錄）
        return `/uploads/activities/${imageName}`;
      } catch (error) {
        console.error('圖片路徑錯誤:', error);
        return '/default-activity.jpg';
      }
    }
    
    // 如果沒有圖片，返回預設圖片
    return '/default-activity.jpg';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">載入中...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">我的收藏</h1>

      {favorites.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">目前沒有收藏的活動</p>
          <Link
            href="/activities"
            className="mt-4 inline-block px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            探索活動
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((activity) => (
            <div
              key={activity.activity_id}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <Link href={`/activities/${activity.activity_id}`}>
                <div className="relative h-48">
                  <Image
                    src={getImageUrl(activity.main_image)}
                    alt={activity.title || '活動圖片'}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    priority={true}
                    onError={(e) => {
                      console.error('圖片載入失敗:', e);
                      e.currentTarget.src = '/default-activity.jpg';
                    }}
                  />
                </div>
                <div className="p-4">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {activity.title}
                  </h2>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p className="flex items-center">
                      <FaCalendarAlt className="mr-2" />
                      {format(new Date(activity.start_date), "yyyy/MM/dd", {
                        locale: zhTW,
                      })}
                      {" - "}
                      {format(new Date(activity.end_date), "yyyy/MM/dd", {
                        locale: zhTW,
                      })}
                    </p>
                    <p className="flex items-center">
                      <FaMapMarkerAlt className="mr-2" />
                      {activity.location}
                    </p>
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <p className="text-lg font-bold text-green-600">
                      NT$ {activity.min_price?.toLocaleString()}
                      {activity.min_price !== activity.max_price &&
                        ` ~ ${activity.max_price?.toLocaleString()}`}
                    </p>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleRemoveFavorite(activity.activity_id);
                      }}
                      className="text-red-500 hover:text-red-600"
                    >
                      <FaHeart className="h-6 w-6" />
                    </button>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
