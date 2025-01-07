import Image from 'next/image';
import { HiPencil, HiTrash } from 'react-icons/hi';

export default function ActivityCard({ activity, onEdit, onDelete }) {
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('zh-TW');
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
      {/* 活動圖片 */}
      <div className="relative h-48">
        <Image
          src={activity.image_url || '/default-activity.jpg'}
          alt={activity.activity_name}
          fill
          className="object-cover"
        />
      </div>

      {/* 活動內容 */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-[#2C4A3B] mb-2 line-clamp-1">
          {activity.activity_name}
        </h3>
        
        <div className="space-y-2 text-sm text-gray-600">
          <p>活動期間：{formatDate(activity.start_date)} - {formatDate(activity.end_date)}</p>
          <p>價格範圍：NT$ {activity.min_price} - {activity.max_price}</p>
          <p>狀態：
            <span className={`inline-block px-2 py-1 rounded-full text-xs 
              ${activity.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
              {activity.is_active ? '上架中' : '已下架'}
            </span>
          </p>
        </div>

        {/* 操作按鈕 */}
        <div className="mt-4 flex justify-end space-x-2">
          <button
            onClick={onEdit}
            className="p-2 rounded-full hover:bg-[#E3D5CA] transition-colors duration-200"
            title="編輯活動"
          >
            <HiPencil className="w-5 h-5 text-[#7D6D61]" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 rounded-full hover:bg-red-100 transition-colors duration-200"
            title="刪除活動"
          >
            <HiTrash className="w-5 h-5 text-red-500" />
          </button>
        </div>
      </div>
    </div>
  );
} 