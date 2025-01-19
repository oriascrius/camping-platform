'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaSearch } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { DatePicker, ConfigProvider } from 'antd';
import locale from 'antd/locale/zh_TW';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-tw';
import { FilterTags } from './FilterTags';

const { RangePicker } = DatePicker;

export function ActivitySearch({ onRemoveTag }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 設定日期限制
  const today = dayjs().startOf('day');
  const maxDate = dayjs().add(1, 'year');  // 最多可以搜尋一年內的活動
  
  const [filters, setFilters] = useState({
    keyword: searchParams.get('keyword') || '',
    dateRange: [
      searchParams.get('startDate') ? dayjs(searchParams.get('startDate')) : null,
      searchParams.get('endDate') ? dayjs(searchParams.get('endDate')) : null
    ],
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || ''
  });

  // 當 URL 參數改變時更新表單
  useEffect(() => {
    setFilters({
      keyword: searchParams.get('keyword') || '',
      dateRange: [
        searchParams.get('startDate') ? dayjs(searchParams.get('startDate')) : null,
        searchParams.get('endDate') ? dayjs(searchParams.get('endDate')) : null
      ],
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || ''
    });
  }, [searchParams]);

  // 日期變更處理
  const handleDateChange = (dates) => {
    if (!dates || dates.length !== 2) {
      setFilters(prev => ({ ...prev, dateRange: [null, null] }));
      return;
    }

    const [start, end] = dates;
    
    // 驗證日期範圍
    if (start && end) {
      // 檢查是否超過最大範圍（90天）
      if (end.diff(start, 'days') > 90) {
        toast.warning('搜尋日期範圍不能超過90天');
        return;
      }
    }

    setFilters(prev => ({ ...prev, dateRange: [start, end] }));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    
    try {
      // 日期驗證
      if (filters.dateRange?.[0] && filters.dateRange?.[1]) {
        const startDate = filters.dateRange[0];
        const endDate = filters.dateRange[1];
        
        // 檢查開始日期是否早於今天
        if (startDate.isBefore(today)) {
          toast.error('開始日期不能早於今天');
          return;
        }
        
        // 檢查結束日期是否超過一年
        if (endDate.isAfter(maxDate)) {
          toast.error('搜尋日期不能超過一年');
          return;
        }
        
        // 檢查日期範圍
        if (endDate.diff(startDate, 'days') > 90) {
          toast.error('搜尋日期範圍不能超過90天');
          return;
        }
      }

      const params = new URLSearchParams(searchParams.toString());
      
      // 更新關鍵字
      if (filters.keyword) {
        params.set('keyword', filters.keyword);
      } else {
        params.delete('keyword');
      }
      
      // 更新日期範圍
      if (filters.dateRange?.[0]) {
        params.set('startDate', filters.dateRange[0].format('YYYY-MM-DD'));
      } else {
        params.delete('startDate');
      }
      
      if (filters.dateRange?.[1]) {
        params.set('endDate', filters.dateRange[1].format('YYYY-MM-DD'));
      } else {
        params.delete('endDate');
      }
      
      // 更新價格範圍
      if (filters.minPrice) {
        params.set('minPrice', filters.minPrice);
      } else {
        params.delete('minPrice');
      }
      
      if (filters.maxPrice) {
        params.set('maxPrice', filters.maxPrice);
      } else {
        params.delete('maxPrice');
      }

      router.push(`/camping/activities?${params.toString()}`);
      
    } catch (error) {
      console.error('搜尋錯誤:', error);
      toast.error('搜尋過程發生錯誤');
    }
  };

  return (
    <ConfigProvider
      theme={{
        components: {
          DatePicker: {
            // 基礎顏色
            colorBgContainer: '#F8F8F8',              // 背景色（淺灰白）
            colorPrimary: '#B6AD9A',                  // 主色調（淡褐色）
            colorBorder: '#E8E4DE',                   // 邊框（淺米色）
            colorText: '#7C7267',                     // 文字（淺褐灰）
            colorTextDisabled: '#D3CDC6',             // 禁用文字（淺灰）
            colorBgContainerDisabled: '#F8F8F8',      // 禁用背景
            
            // 輸入框外觀
            borderRadius: 8,                          // 圓角
            controlHeight: 40,                        // 高度
            
            // 輸入框 hover 和 focus 狀態
            hoverBorderColor: '#C5BDB1',             // hover 邊框（中淺褐）
            activeBorderColor: '#B6AD9A',            // focus 邊框（淡褐色）
            
            // 日期格子的狀態
            cellHoverBg: '#E8E4DE',                  // 日期 hover（淺米色）
            cellActiveWithRangeBg: '#D3CDC6',        // 選中範圍（淺灰）
            cellHoverWithRangeBg: '#E8E4DE',         // 範圍 hover（淺米色）
            
            // 選中狀態
            activeBg: '#C5BDB1',                     // 選中背景（中淺褐）
            
            // 控制按鈕（月份切換等）
            controlItemBgActive: '#D3CDC6',          // 控制項選中（淺灰）
            controlItemBgHover: '#E8E4DE',           // 控制項 hover（淺米色）
          },
        },
      }}
      locale={locale}
    >
      <div className="bg-white p-6 rounded-[var(--border-radius-lg)] shadow mb-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* 關鍵字搜尋 */}
            <div className="relative">
              <input
                type="text"
                placeholder="搜尋活動名稱..."
                className="w-full px-4 py-2 border-[var(--gray-6)] 
                         rounded-[var(--border-radius-md)] 
                         text-[var(--gray-1)]
                         placeholder-[var(--gray-4)]
                         focus:ring-[var(--primary)]
                         focus:border-[var(--primary)]"
                value={filters.keyword}
                onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
              />
              <FaSearch className="absolute right-3 top-3 text-[var(--gray-4)]" />
            </div>

            {/* 日期範圍選擇器 */}
            <div className="col-span-2">
              <RangePicker
                value={filters.dateRange}
                onChange={handleDateChange}
                format="YYYY/MM/DD"
                placeholder={['開始日期', '結束日期']}
                className="w-full"
                allowClear
                showToday
                disabledDate={(current) => {
                  // 禁用今天之前的日期
                  if (current && current < today) {
                    return true;
                  }
                  // 禁用一年後的日期
                  if (current && current > maxDate) {
                    return true;
                  }
                  return false;
                }}
                style={{
                  height: '40px',
                }}
              />
            </div>

            {/* 價格範圍 */}
            <div className="flex space-x-2">
              <input
                type="number"
                min="0"
                placeholder="最低價"
                className="w-1/2 px-4 py-2 
                         border-[var(--gray-6)] 
                         rounded-[var(--border-radius-md)]
                         text-[var(--gray-1)]
                         placeholder-[var(--gray-4)]
                         focus:ring-[var(--primary)]
                         focus:border-[var(--primary)]"
                value={filters.minPrice}
                onChange={(e) => setFilters(prev => ({ ...prev, minPrice: e.target.value }))}
              />
              <input
                type="number"
                min={filters.minPrice || "0"}
                placeholder="最高價"
                className="w-1/2 px-4 py-2 
                         border-[var(--gray-6)] 
                         rounded-[var(--border-radius-md)]
                         text-[var(--gray-1)]
                         placeholder-[var(--gray-4)]
                         focus:ring-[var(--primary)]
                         focus:border-[var(--primary)]"
                value={filters.maxPrice}
                onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => {
                setFilters({
                  keyword: '',
                  dateRange: [null, null],
                  minPrice: '',
                  maxPrice: '',
                });
                router.push('/camping/activities');
              }}
              className="px-6 py-2 border border-[var(--primary)] 
                       text-[var(--primary)] 
                       rounded-[var(--border-radius-md)]
                       hover:bg-[var(--primary)] hover:text-white
                       transition-colors"
            >
              清除搜尋
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-[var(--primary)] text-white 
                       rounded-[var(--border-radius-md)] 
                       hover:bg-[var(--secondary-4)] 
                       focus:outline-none focus:ring-2 
                       focus:ring-[var(--primary)] focus:ring-offset-2
                       transition-colors"
            >
              搜尋
            </button>
          </div>
        </form>

        <div className="mt-4">
          <FilterTags onRemoveTag={onRemoveTag} />
        </div>
      </div>
    </ConfigProvider>
  );
} 