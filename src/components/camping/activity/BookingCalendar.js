"use client";
import { motion, AnimatePresence } from "framer-motion";
import {
  format,
  startOfMonth,
  endOfMonth,
  getDay,
  addDays,
  subDays,
  isSameDay,
  addMonths,
  isSameMonth,
} from "date-fns";
import { zhTW } from "date-fns/locale";
import { useState } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { Tooltip } from "antd";

const BookingCalendar = ({ activity, bookingStats }) => {
  const [currentDate, setCurrentDate] = useState(
    new Date(activity?.start_date)
  );
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDetailPopup, setShowDetailPopup] = useState(false);

  // 添加 log 檢查傳入的 props
  // console.log("Activity Data:", activity);
  // console.log("Booking Stats:", bookingStats);

  // 生成日曆天數
  const generateCalendarDays = () => {
    const startDate = startOfMonth(currentDate);
    const endDate = endOfMonth(currentDate);
    const days = [];

    // console.log("Generating Calendar Days:", {
    //   currentMonth: format(currentDate, "yyyy-MM"),
    //   startDate: format(startDate, "yyyy-MM-dd"),
    //   endDate: format(endDate, "yyyy-MM-dd"),
    // });

    // 填充月初空白天數
    const startDay = getDay(startDate);
    for (let i = 0; i < startDay; i++) {
      days.push(subDays(startDate, startDay - i));
    }

    // 填充日期
    let date = startDate;
    while (date <= endDate) {
      days.push(date);
      date = addDays(date, 1);
    }

    // 填充月末空白天數
    const endDay = getDay(endDate);
    for (let i = 1; i < 7 - endDay; i++) {
      days.push(addDays(endDate, i));
    }

    // console.log(
    //   "Generated Days:",
    //   days.map((d) => format(d, "yyyy-MM-dd"))
    // );
    return days;
  };

  const handlePrevMonth = () => {
    setCurrentDate((prev) => addMonths(prev, -1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => addMonths(prev, 1));
  };

  // 修正日期範圍判斷
  const isDateInRange = (date) => {
    if (!activity?.start_date || !activity?.end_date) {
      // console.log("No activity dates available");
      return false;
    }

    // 將日期字串轉換為 Date 物件，並設定時間為 00:00:00
    const startDate = new Date(activity.start_date);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(activity.end_date);
    endDate.setHours(0, 0, 0, 0);

    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    const isInRange = checkDate >= startDate && checkDate <= endDate;

    // console.log("Date Range Check:", {
    //   date: format(checkDate, "yyyy-MM-dd"),
    //   startDate: format(startDate, "yyyy-MM-dd"),
    //   endDate: format(endDate, "yyyy-MM-dd"),
    //   isInRange,
    // });

    return isInRange;
  };

  // 處理日期點擊
  const handleDateClick = (date) => {
    if (isDateInRange(date)) {
      if (selectedDate && isSameDay(selectedDate, date)) {
        // 如果點擊同一天，則關閉懸浮窗
        setSelectedDate(null);
        setShowDetailPopup(false);
      } else {
        // 點擊不同天，則顯示該天的懸浮窗
        setSelectedDate(date);
        setShowDetailPopup(true);
      }
    }
  };

  // 獲取日期的預訂狀態
  const getBookingStatus = (spots) => {
    if (!spots || spots.length === 0) return "available";

    const hasFullyBooked = spots.some((spot) => spot.available === 0);
    const hasPartiallyBooked = spots.some(
      (spot) => spot.available < spot.total
    );

    if (hasFullyBooked) return "full";
    if (hasPartiallyBooked) return "partial";
    return "available";
  };

  // 獲取日期的預訂資訊
  const getBookingInfo = (date) => {
    if (!isDateInRange(date)) return null;

    const dateKey = format(date, "yyyy-MM-dd");
    const spots =
      activity?.spot_options?.map((spot) => ({
        name: spot.name,
        total: spot.max_quantity,
        available:
          spot.max_quantity - (bookingStats?.[dateKey]?.[spot.id] || 0),
        price: spot.price,
      })) || [];

    return {
      status: getBookingStatus(spots),
      spots,
    };
  };

  // 獲取狀態對應的顏色和文字
  const getStatusInfo = (status) => {
    switch (status) {
      case "full":
        return { color: "bg-red-500", text: "已滿" };
      case "partial":
        return { color: "bg-yellow-500", text: "部分預訂" };
      default:
        return { color: "bg-green-500", text: "可預訂" };
    }
  };

  const activityStartMonth = startOfMonth(new Date(activity?.start_date));
  const activityEndMonth = endOfMonth(new Date(activity?.end_date));

  return (
    <motion.div
      className="bg-white rounded-lg p-6 shadow-md max-w-[1000px] border border-gray-100"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* 標題區塊 */}
      <motion.div
        className="flex items-center gap-2 text-[#8B7355] mb-4 pb-3 border-b border-gray-100"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <h3 className="text-lg font-semibold m-0">預訂時間分布</h3>
      </motion.div>

      {/* 月份導航 */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={handlePrevMonth}
          className="p-2 hover:bg-gray-50 rounded-full transition-colors"
        >
          <FaChevronLeft className="text-[#8B7355]" />
        </button>
        <h4 className="text-[#4A3C31] font-medium">
          {format(currentDate, "yyyy年 MM月")}
        </h4>
        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-gray-50 rounded-full transition-colors"
        >
          <FaChevronRight className="text-[#8B7355]" />
        </button>
      </div>

      {/* 圖例 */}
      <motion.div
        className="flex justify-center gap-6 mb-4 py-2 px-4 bg-[#F8F6F3] rounded-lg"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {[
          { status: "available", color: "bg-green-500", text: "可預訂" },
          { status: "partial", color: "bg-yellow-500", text: "部分預訂" },
          { status: "full", color: "bg-red-500", text: "已滿" },
        ].map((item) => (
          <div key={item.status} className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${item.color}`} />
            <span className="text-sm text-[#4A3C31]">{item.text}</span>
          </div>
        ))}
      </motion.div>

      {/* 日曆主體 */}
      <div className="grid grid-cols-7 gap-2 p-2 bg-[#F8F6F3] rounded-lg">
        {/* 星期標題 - 添加 key */}
        {["日", "一", "二", "三", "四", "五", "六"].map((day, index) => (
          <div
            key={`weekday-${index}`}
            className="text-center py-2 text-[#8B7355] text-sm font-medium"
          >
            {day}
          </div>
        ))}

        {/* 日期格子 */}
        {generateCalendarDays().map((date) => {
          const isToday = isSameDay(date, new Date());
          const isCurrentMonth = isSameMonth(date, currentDate);
          const inRange = isDateInRange(date);
          const dateKey = format(date, "yyyy-MM-dd");
          const bookingInfo = getBookingInfo(date);
          const isSelected = selectedDate && isSameDay(date, selectedDate);
          const statusInfo = getStatusInfo(bookingInfo?.status);

          return (
            <div key={dateKey} className="relative">
              <motion.div
                className={`
                  relative aspect-square p-2 rounded-lg bg-white
                  ${isCurrentMonth ? "bg-white" : "bg-gray-50"}
                  ${isToday ? "ring-2 ring-green-500" : "ring-1 ring-gray-100"}
                  ${isSelected ? "ring-2 ring-blue-500 bg-blue-50" : ""}
                  ${
                    inRange
                      ? "hover:shadow-md hover:ring-2 hover:ring-green-400 cursor-pointer"
                      : ""
                  }
                  group transition-all duration-200
                `}
                onClick={() => handleDateClick(date)}
              >
                <div className="h-full flex flex-col items-center justify-between">
                  <span
                    className={`
                    text-sm font-medium
                    ${isCurrentMonth ? "text-[#4A3C31]" : "text-[#9F9189]"}
                  `}
                  >
                    {format(date, "d")}
                  </span>

                  {inRange && (
                    <>
                      <motion.div className="mt-1">
                        <motion.div
                          className={`w-2 h-2 rounded-full ${statusInfo.color}`}
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      </motion.div>
                      <span className="text-xs text-gray-400 mt-1">
                        {statusInfo.text}
                      </span>
                    </>
                  )}
                </div>

                {/* 點擊後的懸浮窗 */}
                {isSelected && showDetailPopup && inRange && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="
                      absolute z-[9999] 
                      
                      /* 手機版定位 */
                      left-[-140px] bottom-[60px] -translate-y-full
                      
                      /* PC版定位 (md:768px以上) */
                      md:right-[-105px] md:bottom-[130px] md:left-auto md:top-auto
                      
                      bg-white rounded-xl shadow-lg border border-gray-100
                      min-w-[320px] mt-[-10px]
                      
                      /* RWD 調整 */
                      sm:p-6 p-4
                      sm:min-w-[320px] min-w-[280px]
                    "
                  >
                    {/* 標題區域 */}
                    <div className="flex justify-between items-start border-b border-gray-100">
                      <div>
                        <h3 className="text-lg font-medium text-[#4A3C31]">
                          {format(date, "yyyy年MM月dd日")}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1.5">
                          {format(date, "EEEE", { locale: zhTW })}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDetailPopup(false);
                          setSelectedDate(null);
                        }}
                        className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-50 rounded-full transition-colors"
                      >
                        ✕
                      </button>
                    </div>

                    {/* 預訂狀態 */}
                    <div className="mb-2 py-2 px-3 bg-gray-50 rounded-lg flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${statusInfo.color}`}
                      />
                      <span className="text-sm text-[#4A3C31] font-medium">
                        預訂狀態：{statusInfo.text}
                      </span>
                    </div>

                    {/* 溫馨提醒 */}
                    <div className="space-y-2">
                      <div className="text-sm text-[#4A3C31] font-medium ms-2">
                        溫馨提醒：
                      </div>
                      <ul className="space-y-2.5 p-0">
                        <li className="flex items-start gap-2 text-[13px] text-gray-500">
                          <span className="text-green-500">•</span>
                          <span>預訂確認後，請於 30 分鐘內完成付款</span>
                        </li>
                        <li className="flex items-start gap-2 text-[13px] text-gray-500">
                          <span className="text-green-500">•</span>
                          <span>如需更改或取消預訂，請提前 3 天聯繫客服</span>
                        </li>
                      </ul>
                    </div>

                    {/* 調整箭頭位置到中間底部 */}
                    <div className="
                      absolute -bottom-2 left-1/2 transform -translate-x-1/2
                      w-4 h-4 bg-white rotate-45 border-r border-b border-gray-100
                      shadow-sm
                    "/>
                  </motion.div>
                )}
              </motion.div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default BookingCalendar;
