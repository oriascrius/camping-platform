import Image from "next/image";
import {
  HiPencil,
  HiTrash,
  HiClock,
  HiCurrencyDollar,
  HiUsers,
  HiLocationMarker,
  HiCalendar,
  HiOfficeBuilding,
  HiStatusOnline,
} from "react-icons/hi";
import { motion } from "framer-motion";

export default function ActivityCard({ activity, onEdit, onDelete }) {
  // 日期格式化
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("zh-TW");
  };

  // 計算活動天數
  const getDaysDifference = () => {
    const start = new Date(activity.start_date);
    const end = new Date(activity.end_date);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // 計算參加資訊
  const getRegistrationInfo = () => {
    const totalSpots = parseInt(activity.total_spots) || 0;
    const bookedSpots = parseInt(activity.booked_spots) || 0;
    const availableSpots = totalSpots - bookedSpots;

    return {
      availableText: availableSpots > 0 ? `剩餘 ${availableSpots} 位` : "已額滿",
      available: availableSpots > 0
    };
  };

  // 判斷活動狀態
  const getActivityStatus = () => {
    const today = new Date();
    const startDate = new Date(activity.start_date);
    const endDate = new Date(activity.end_date);

    // 增加營地營運狀態判斷
    if (activity.operation_status !== 1) {
      return {
        text: "暫停營業",
        class: "bg-gray-100 text-gray-600",
      };
    }

    if (today < startDate) {
      return {
        text: "未開始",
        class: "bg-[#E3D5CA] text-[#7D6D61]",
      };
    }
    if (today > endDate) {
      return {
        text: "已結束",
        class: "bg-gray-100 text-gray-600",
      };
    }
    return {
      text: "進行中",
      class: "bg-[#E8F0EB] text-[#2C4A3B]",
    };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 
                    border border-gray-100"
    >
      {/* 活動圖片 */}
      <div className="relative h-48">
        <Image
          src={
            activity.main_image
              ? `/uploads/activities/${activity.main_image}`
              : activity.camp_image || "/default-activity.jpg"
          }
          alt={activity.activity_name || activity.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover rounded-t-lg"
        />
        {/* 狀態標籤 */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          {/* 可見度狀態 */}
          <span
            className={`px-3 py-1.5 rounded-full text-xs font-medium shadow-sm
            ${
              activity.is_active && activity.operation_status === 1
                ? "bg-[#6B8E7B] text-white"
                : "bg-gray-400 text-white"
            }`}
          >
            {activity.is_active && activity.operation_status === 1 ? "可參加" : "不可參加"}
          </span>

          {/* 時間狀態 */}
          <span
            className={`px-3 py-1.5 rounded-full text-xs font-medium shadow-sm ${
              getActivityStatus().class
            }`}
          >
            {getActivityStatus().text}
          </span>
        </div>
      </div>

      {/* 活動內容 */}
      <div className="p-4 space-y-4">
        {/* 活動名稱 */}
        <h3 className="text-lg font-bold text-[#2C4A3B]">
          {activity.activity_name}
        </h3>
        {/* 活動描述 */}
        {activity.description && (
          <p className="text-sm text-gray-500 line-clamp-2">
            {activity.description}
          </p>
        )}
        {/* 地點資訊 */}
        <div className="flex items-center text-sm">
          <HiLocationMarker className="w-4 h-4 mr-2 text-[#6B8E7B]" />
          <span className="text-[#4B5563] line-clamp-1">
            {activity.camp_address}
          </span>
        </div>

        {/* 營地資訊 */}
        <div className="flex items-center text-sm">
          <HiOfficeBuilding className="w-4 h-4 mr-2 text-[#6B8E7B]" />
          <span className="text-[#4B5563]">{activity.camp_name}</span>
        </div>

        {/* 重要資訊區塊 */}
        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg">
          {/* 活動天數 */}
          <div className="space-y-1">
            <span className="text-xs text-[#6B8E7B]">活動天數</span>
            <div className="flex items-center">
              <HiClock className="w-4 h-4 mr-2 text-[#6B8E7B]" />
              <span className="font-medium">{getDaysDifference()} 天</span>
            </div>
          </div>

          {/* 參加狀況 */}
          <div className="space-y-1">
            <span className="text-xs text-[#6B8E7B]">參加狀況</span>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <HiUsers className="w-4 h-4 mr-2 text-[#6B8E7B]" />
                <span
                  className={`text-sm px-2 py-1 rounded ${
                    getRegistrationInfo().available
                      ? "bg-[#E8F0EB] text-[#2C4A3B]"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {getRegistrationInfo().availableText}
                </span>
              </div>
            </div>
          </div>

          {/* 活動日期 */}
          <div className="space-y-1">
            <span className="text-xs text-[#6B8E7B]">開始日期</span>
            <div className="flex items-center">
              <HiCalendar className="w-4 h-4 mr-2 text-[#6B8E7B]" />
              <span>{formatDate(activity.start_date)}</span>
            </div>
          </div>

          {/* 活動價格 */}
          <div className="space-y-1">
            <span className="text-xs text-[#6B8E7B]">價格範圍</span>
            <div className="flex items-center">
              <HiCurrencyDollar className="w-4 h-4 mr-2 text-[#6B8E7B]" />
              <span>
                NT$ {activity.min_price?.toLocaleString()}
                {activity.max_price &&
                  activity.max_price !== activity.min_price &&
                  ` - ${activity.max_price?.toLocaleString()}`}
              </span>
            </div>
          </div>
        </div>

        {/* 操作按鈕 */}
        <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
          <button
            onClick={() => onEdit(activity)}
            className="p-2 rounded-lg bg-[#E8F0EB] hover:bg-[#D1E2D7] transition-colors duration-200"
            title="編輯活動"
          >
            <HiPencil className="w-4 h-4 text-[#2C4A3B]" />
          </button>
          <button
            onClick={() => onDelete(activity.activity_id)}
            className="p-2 rounded-lg bg-[#FDE8E8] hover:bg-[#FBD5D5] transition-colors duration-200"
            title="刪除活動"
          >
            <HiTrash className="w-4 h-4 text-[#9B1C1C]" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
