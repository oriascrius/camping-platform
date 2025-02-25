'use client';
import { motion } from 'framer-motion';
import { format, startOfMonth, endOfMonth, getDay, addDays, subDays, isSameDay, addMonths, isSameMonth } from 'date-fns';
import { useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const BookingCalendar = ({ activity, bookingStats }) => {
  const [currentDate, setCurrentDate] = useState(new Date(activity?.start_date));

  // 生成日曆天數
  const generateCalendarDays = () => {
    const startDate = startOfMonth(currentDate);
    const endDate = endOfMonth(currentDate);
    const days = [];
    
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
    
    return days;
  };

  const handlePrevMonth = () => {
    setCurrentDate(prev => addMonths(prev, -1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => addMonths(prev, 1));
  };

  const getBookingStatus = (date) => {
    // 這裡需要根據 bookingStats 來判斷該日期的預訂狀態
    return 'available'; // 預設值
  };

  const isDateInRange = (date) => {
    return date >= new Date(activity?.start_date) && 
           date <= new Date(activity?.end_date);
  };

  const activityStartMonth = startOfMonth(new Date(activity?.start_date));
  const activityEndMonth = endOfMonth(new Date(activity?.end_date));

  return (
    <div className="bg-white rounded-lg p-3 shadow-sm max-w-[1000px]">
      <div className="flex items-center gap-2 text-[#8B7355] mb-2">
        <motion.svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          animate={{
            scale: [1, 1.1, 1],
            rotate: [-3, 3, -3],
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
        <h3 className="text-lg font-semibold m-0">預訂時間分布</h3>
      </div>

      <div className="space-y-2">
        {/* 月份切換 */}
        <div className="flex items-center justify-between px-1">
          <button 
            onClick={handlePrevMonth}
            disabled={currentDate <= activityStartMonth}
            className={`p-0.5 rounded-full hover:bg-[#F8F6F3] transition-colors
              ${currentDate <= activityStartMonth ? 'text-gray-300 cursor-not-allowed' : 'text-[#8B7355]'}
            `}
          >
            <FaChevronLeft className="w-3 h-3" />
          </button>
          <span className="text-base font-medium text-[#4A3C31]">
            {format(currentDate, 'yyyy年 MM月')}
          </span>
          <button 
            onClick={handleNextMonth}
            disabled={currentDate >= activityEndMonth}
            className={`p-0.5 rounded-full hover:bg-[#F8F6F3] transition-colors
              ${currentDate >= activityEndMonth ? 'text-gray-300 cursor-not-allowed' : 'text-[#8B7355]'}
            `}
          >
            <FaChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* 日曆視圖 */}
        <div className="grid grid-cols-7 gap-0.5">
          {/* 星期標題 */}
          {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
            <div 
              key={day}
              className="text-center py-0.5 text-[#8B7355] text-[13px] font-medium"
            >
              {day}
            </div>
          ))}

          {/* 日期格子 */}
          {generateCalendarDays().map((date, index) => {
            const isInRange = isDateInRange(date);
            const isToday = isSameDay(date, new Date());
            const isCurrentMonth = isSameMonth(date, currentDate);
            const bookingStatus = getBookingStatus(date);

            return (
              <motion.div
                key={index}
                className={`
                  aspect-square p-[1px] rounded-sm
                  ${isInRange && isCurrentMonth
                    ? 'bg-white border border-[#E5DED5]' 
                    : 'bg-[#F8F6F3] opacity-50'
                  }
                  ${isToday ? 'ring-1 ring-[#2B5F3A] ring-offset-1' : ''}
                `}
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <div className="h-full flex flex-col">
                  <div className={`
                    text-center text-[12px] font-medium
                    ${isInRange && isCurrentMonth ? 'text-[#4A3C31]' : 'text-[#9F9189]'}
                  `}>
                    {format(date, 'd')}
                  </div>

                  {isInRange && isCurrentMonth && (
                    <div className="flex-grow flex items-center justify-center">
                      <div className={`
                        w-2 h-2 rounded-full
                        ${bookingStatus === 'full' && 'bg-red-500'}
                        ${bookingStatus === 'partial' && 'bg-yellow-500'}
                        ${bookingStatus === 'available' && 'bg-green-500'}
                      `} />
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* 圖例說明 */}
        <div className="flex gap-3 justify-center text-[12px] text-[#9F9189]">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
            可預訂
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
            部分預訂
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
            已滿
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingCalendar; 