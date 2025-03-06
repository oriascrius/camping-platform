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
  isBefore,
  startOfToday,
  eachDayOfInterval,
  subMonths,
  isWithinInterval,
} from "date-fns";
import { zhTW } from "date-fns/locale";
import { useState, useEffect } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { Tooltip } from "antd";
import { createPortal } from 'react-dom';

const BookingCalendar = ({ 
  activity, 
  bookingStats,
  onDateSelect,
  selectedBookingDate,
  selectedEndDate 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDetailPopup, setShowDetailPopup] = useState(false);
  const [selectionStep, setSelectionStep] = useState('start'); // 'start' 或 'end'
  const [isMobile, setIsMobile] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0, width: 0, height: 0 });

  // 添加 log 檢查傳入的 props
  // console.log("Activity Data:", activity);
  // console.log("Booking Stats:", bookingStats);

  // 檢測螢幕寬度
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 處理月份切換
  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  // 生成日曆天數
  const generateCalendarDays = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  };

  // 判斷日期是否在活動範圍內
  const isDateInRange = (date) => {
    if (!activity?.start_date || !activity?.end_date) return false;
    const startDate = new Date(activity.start_date);
    const endDate = new Date(activity.end_date);
    return date >= startDate && date <= endDate;
  };

  // 判斷日期是否已過期
  const isDatePassed = (date) => {
    return isBefore(date, startOfToday());
  };

  // 獲取預訂狀態
  const getBookingStatus = (spots) => {
    if (!spots || spots.length === 0) return "available";
    const hasFullyBooked = spots.some((spot) => spot.available === 0);
    const hasPartiallyBooked = spots.some((spot) => spot.available < spot.total);
    if (hasFullyBooked) return "full";
    if (hasPartiallyBooked) return "partial";
    return "available";
  };

  // 獲取日期的預訂資訊
  const getBookingInfo = (date) => {
    if (!isDateInRange(date)) return null;

    const dateKey = format(date, "yyyy-MM-dd");
    const spots = activity?.spot_options?.map((spot) => ({
      name: spot.name,
      total: spot.max_quantity,
      available: spot.max_quantity - (bookingStats?.[dateKey]?.[spot.id] || 0),
      price: spot.price,
    })) || [];

    return {
      status: getBookingStatus(spots),
      spots,
    };
  };

  // 獲取狀態對應的顏色和文字
  const getStatusInfo = (status, date) => {
    if (isDatePassed(date)) {
      return { 
        color: "bg-gray-400", 
        text: "已過期",
        dotColor: "bg-gray-400",
        textColor: "text-gray-500"
      };
    }

    if (!isDateInRange(date)) {
      return { 
        color: "bg-gray-300", 
        text: "未開放",
        dotColor: "bg-gray-300",
        textColor: "text-gray-400"
      };
    }

    switch (status) {
      case "full":
        return { 
          color: "bg-red-500", 
          text: "已滿",
          dotColor: "bg-red-500",
          textColor: "text-red-600"
        };
      case "partial":
        return { 
          color: "bg-yellow-500", 
          text: "部分預訂",
          dotColor: "bg-yellow-500",
          textColor: "text-yellow-600"
        };
      default:
        return { 
          color: "bg-green-500", 
          text: "可預訂",
          dotColor: "bg-green-500",
          textColor: "text-green-600"
        };
    }
  };

  // 處理日期點擊
  const handleDateClick = (date, event) => {
    if (!isDateInRange(date) || isDatePassed(date)) return;

    const bookingInfo = getBookingInfo(date);
    if (!bookingInfo || bookingInfo.status === 'full') return;

    // 如果是選擇結束日期，確保日期在開始日期之後
    if (selectionStep === 'end' && selectedBookingDate) {
      if (isBefore(date, selectedBookingDate)) return;
    }

    // 獲取點擊元素的位置
    const rect = event.currentTarget.getBoundingClientRect();
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    setSelectedDate(date);
    setPopupPosition({
      x: rect.left + scrollX,  // 不加上 width/2，讓它以左邊為基準
      y: rect.top + scrollY,
      width: rect.width,
      height: rect.height
    });
    setShowDetailPopup(true);
  };

  // 處理日期選擇確認
  const handleDateSelect = (date) => {
    if (selectionStep === 'start') {
      // 選擇入營日期
      onDateSelect?.(date, 'select', 'start');
      setSelectionStep('end'); // 切換到選擇結束日期
    } else {
      // 選擇退房日期
      onDateSelect?.(date, 'select', 'end');
      setSelectionStep('start'); // 重置為選擇開始日期
    }
    
    // 清除當前選擇狀態和關閉彈出視窗
    setShowDetailPopup(false);
    setSelectedDate(null);
  };

  // 渲染浮出卡片
  const renderPopupContent = () => {
    if (!showDetailPopup || !selectedDate) return null;

    return createPortal(
      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className={`
          absolute bg-white rounded-lg shadow-lg border border-gray-200
          ${isMobile ? 'w-[calc(100%-32px)] mx-4' : 'w-[280px]'}
        `}
        style={{ 
          position: 'absolute',
          left: isMobile ? '50%' : `${popupPosition.x}px`,
          top: isMobile ? '50%' : `${popupPosition.y}px`,
          transform: isMobile 
            ? 'translate(-50%, -50%)' 
            : 'translate(-80%, -150%)',  // 將 -130% 改為 -150% 讓卡片往上移更多
          zIndex: 99999,
          marginTop: '-280px',    // 增加上方間距
          marginLeft: '-80px'
        }}
      >
        <div className="p-4">
          {/* 關閉按鈕 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDetailPopup(false);
              setSelectedDate(null);
            }}
            className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
          >
            ×
          </button>

          {/* 日期顯示 */}
          <div className="mb-2">
            <h4 className="text-base font-medium text-gray-900">
              {format(selectedDate, 'yyyy年MM月dd日', { locale: zhTW })}
            </h4>
            <p className="text-sm text-gray-500 mb-0">
              星期{format(selectedDate, 'E', { locale: zhTW })}
            </p>
          </div>

          {/* 選擇提示 */}
          <div className="mb-2">
            <div className="flex items-center gap-2 text-green-600">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span className="text-sm">
                {selectionStep === 'start' 
                  ? '請選擇入營日期' 
                  : `請選擇拔營日期 (${format(selectedBookingDate, 'MM/dd')} 之後)`}
              </span>
            </div>
          </div>

          {/* 溫馨提醒 */}
          <div className="mb-2">
            <h5 className="text-sm font-medium text-gray-700 mb-2">溫馨提醒：</h5>
            <ul className="text-xs text-gray-500 space-y-2 list-disc list-inside p-0">
              <li>預訂確認後，請於 30 分鐘內完成付款</li>
              <li>如需更改或取消預訂，請提前 3 天聯繫客服</li>
            </ul>
          </div>

          {/* 選擇按鈕 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDateSelect(selectedDate);
            }}
            className="w-full py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
          >
            選擇{selectionStep === 'start' ? '入營' : '拔營'}日期
          </button>
        </div>
      </motion.div>,
      document.body
    );
  };

  const activityStartMonth = startOfMonth(new Date(activity?.start_date));
  const activityEndMonth = endOfMonth(new Date(activity?.end_date));

  return (
    <motion.div
      className="bg-white rounded-lg p-6 shadow-md max-w-[1000px] border border-gray-100 overflow-x-hidden"
      style={{ position: 'relative' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* 標題區塊 */}
      <motion.div
        className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <motion.svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5 text-[#8B7355]"
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
          animate={{
            scale: [1, 1.1, 1],
            y: [-1, 1, -1],
            rotate: [-3, 3, -3]
          }}
          transition={{
            duration: 3,
            ease: "easeInOut",
            repeat: Infinity,
          }}
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </motion.svg>
        <h2 className="text-xl font-bold text-[#8B7355] flex items-center gap-2 m-0">
          預訂時間分布
        </h2>
        <div className="ms-3 mt-2 text-[#9F9189] text-sm">
          {activity?.start_date && activity?.end_date && (
            <span>
              {format(new Date(activity.start_date), 'yyyy/MM/dd')} - {format(new Date(activity.end_date), 'yyyy/MM/dd')}
            </span>
          )}
        </div>
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
          { status: "expired", color: "bg-gray-400", text: "已過期" },
        ].map((item) => (
          <div key={item.status} className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${item.color}`} />
            <span className="text-sm text-[#4A3C31]">{item.text}</span>
          </div>
        ))}
      </motion.div>

      {/* 日曆主體 */}
      <div className="grid grid-cols-7 gap-2 p-2 bg-[#F8F6F3] rounded-lg relative">
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
          const isStartDate = selectedBookingDate && isSameDay(date, selectedBookingDate);
          const isEndDate = selectedEndDate && isSameDay(date, selectedEndDate);
          const isInRange = selectedBookingDate && selectedEndDate && 
            isWithinInterval(date, { start: selectedBookingDate, end: selectedEndDate });
          const isPast = isDatePassed(date);
          const statusInfo = getStatusInfo(bookingInfo?.status, date);

          return (
            <div key={dateKey} className="relative">
              <motion.div
                className={`
                  relative aspect-square p-2 rounded-lg
                  ${isCurrentMonth ? "bg-white" : "bg-gray-50"}
                  ${isToday ? "ring-2 ring-green-500" : "ring-1 ring-gray-100"}
                  ${isSelected ? "ring-2 ring-blue-500 bg-blue-50" : ""}
                  ${isStartDate ? "bg-green-100" : ""}
                  ${isEndDate ? "bg-green-100" : ""}
                  ${isInRange ? "bg-green-50" : ""}
                  ${
                    inRange && !isPast && (selectionStep === 'start' || (selectionStep === 'end' && !isBefore(date, selectedBookingDate)))
                      ? "hover:shadow-md hover:ring-2 hover:ring-green-400 cursor-pointer"
                      : "cursor-not-allowed"
                  }
                  group transition-all duration-200
                `}
                onClick={(event) => handleDateClick(date, event)}
              >
                <div className="h-full flex flex-col items-center justify-between">
                  <span
                    className={`
                      text-sm font-medium
                      ${isCurrentMonth ? "text-[#4A3C31]" : "text-[#9F9189]"}
                      ${isPast ? "text-gray-400" : ""}
                    `}
                  >
                    {format(date, "d")}
                  </span>

                  {inRange && (
                    <>
                      <motion.div className="mt-1">
                        <motion.div
                          className={`w-2 h-2 rounded-full ${statusInfo.dotColor}`}
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      </motion.div>
                      <span className={`text-xs ${statusInfo.textColor} mt-1`}>
                        {statusInfo.text}
                      </span>
                    </>
                  )}
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>

      {/* 渲染浮出卡片 */}
      {renderPopupContent()}
    </motion.div>
  );
};

export default BookingCalendar;
