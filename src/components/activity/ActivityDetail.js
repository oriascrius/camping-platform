'use client';
import Image from 'next/image';
import { FaCalendarAlt, FaMapMarkerAlt, FaUsers, FaClock } from 'react-icons/fa';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';

export function ActivityDetail({ activity }) {
  const formatDate = (dateString) => {
    try {
      if (!dateString) return '日期未設定';
      
      // 如果是 Date 物件，直接使用
      if (dateString instanceof Date) {
        return format(dateString, 'yyyy年MM月dd日', { locale: zhTW });
      }
      
      // 如果是字串，先轉換成 Date 物件
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.error('無效的日期:', dateString);
        return '日期格式錯誤';
      }
      
      return format(date, 'yyyy年MM月dd日', { locale: zhTW });
    } catch (error) {
      console.error('日期處理錯誤:', error);
      return '日期未設定';
    }
  };

  // 檢查活動資料是否存在
  if (!activity) {
    return <div>找不到活動資料</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* 活動主圖 */}
      <div className="relative h-96">
        {activity.main_image ? (
          <Image
            src={`/uploads/activities/${activity.main_image}`}
            alt={activity.activity_name || '活動圖片'}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400">無圖片</span>
          </div>
        )}
      </div>

      {/* 活動資訊 */}
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {activity.activity_name || '未命名活動'}
        </h1>
        
        <div className="text-lg text-green-600 font-semibold mb-4">
          NT$ {Number(activity.min_price || 0).toLocaleString()} 
          {activity.min_price !== activity.max_price && activity.max_price && 
            ` ~ ${Number(activity.max_price).toLocaleString()}`
          }
        </div>

        {/* 活動基本資訊 */}
        <div className="space-y-3 mb-6">
          {(activity.start_date || activity.end_date) && (
            <div className="flex items-center text-gray-600">
              <FaCalendarAlt className="w-5 h-5 mr-2" />
              <span>
                {formatDate(activity.start_date)} ~ {formatDate(activity.end_date)}
              </span>
            </div>
          )}
          
          {activity.location && (
            <div className="flex items-center text-gray-600">
              <FaMapMarkerAlt className="w-5 h-5 mr-2" />
              <span>{activity.location}</span>
            </div>
          )}
          
          {activity.total_spots && (
            <div className="flex items-center text-gray-600">
              <FaUsers className="w-5 h-5 mr-2" />
              <span>名額：{activity.total_spots} 位</span>
            </div>
          )}

          {activity.registration_deadline && (
            <div className="flex items-center text-gray-600">
              <FaClock className="w-5 h-5 mr-2" />
              <span>報名截止：{formatDate(activity.registration_deadline)}</span>
            </div>
          )}
        </div>

        {/* 活動說明 */}
        <div className="space-y-6">
          {activity.description && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">活動介紹</h2>
              <div className="prose max-w-none">
                {activity.description.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-4 text-gray-600">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* 注意事項 */}
          {activity.notes && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">注意事項</h2>
              <div className="prose max-w-none">
                {activity.notes.split('\n').map((note, index) => (
                  <p key={index} className="mb-4 text-gray-600">
                    {note}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* 取消政策 */}
          {activity.cancellation_policy && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">取消政策</h2>
              <div className="prose max-w-none">
                {activity.cancellation_policy.split('\n').map((policy, index) => (
                  <p key={index} className="mb-4 text-gray-600">
                    {policy}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 