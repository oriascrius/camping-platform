"use client";
// ===== React 相關引入 =====
import { useState, useEffect, useCallback } from "react";                 // 引入 React 狀態管理和生命週期鉤子
import { useSearchParams, useRouter } from 'next/navigation';  // 添加這行
import debounce from 'lodash/debounce';  // 需要安裝 lodash
import useSWR from 'swr';

// ===== UI 組件和圖標引入 =====
import { FaSearch } from "react-icons/fa";                  // 引入搜尋圖標
import { DatePicker, ConfigProvider, InputNumber, Select } from "antd";          // 引入 Ant Design 日期選擇器和全局配置
import locale from "antd/locale/zh_TW";                     // 引入 Ant Design 繁體中文語言包

// ===== 日期處理工具引入 =====
import dayjs from "dayjs";                                  // 引入日期處理工具
import "dayjs/locale/zh-tw";                               // 引入 dayjs 繁體中文語言包

// ===== 自定義組件引入 =====
import { FilterTags } from "./FilterTags";                  // 引入過濾標籤組件

// ===== 自定義提示工具引入 =====
import { 
  showSearchAlert,           // 引入搜尋相關的彈窗提示工具（用於重要提示和錯誤）
} from "@/utils/sweetalert";

// ===== 自定義工具引入 =====
import {
  searchToast,              // 引入搜尋相關的輕量提示工具（用於一般提示）
  ToastContainerComponent   // 引入 Toast 容器組件（用於顯示輕量提示）
} from "@/utils/toast";

import Loading from "@/components/Loading";  // 添加 Loading 組件引入

// ===== 組件常量定義 =====
const { RangePicker } = DatePicker;                        // 解構日期範圍選擇器組件

export function ActivitySearch({ onFilterChange, initialFilters }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSearching, setIsSearching] = useState(false);  // 添加搜尋狀態

  // 設定日期限制
  const today = dayjs().startOf("day");
  const maxDate = dayjs().add(1, "year"); // 最多可以搜尋一年內的活動

  // 使用本地狀態，不依賴 URL 參數
  const [filters, setFilters] = useState({
    keyword: "",
    dateRange: [null, null],
    minPrice: "",
    maxPrice: "",
    sortBy: 'date_desc',
    location: 'all'
  });

  // 使用 useCallback 包裝 debounce 函數
  const debouncedSearch = useCallback(
    debounce((value) => {
      const updatedFilters = { ...filters, keyword: value };
      onFilterChange(updatedFilters);
    }, 300),  // 300ms 的延遲
    [filters]
  );

  // 處理日期變更
  const handleDateChange = (dates) => {
    // 如果清除日期
    if (!dates || dates.length !== 2) {
      const updatedFilters = { ...filters, dateRange: [null, null] };
      setFilters(updatedFilters);
      onFilterChange({
        ...updatedFilters,
        startDate: null,
        endDate: null,
      });
      return;
    }

    const [start, end] = dates;

    // 檢查日期範圍是否超過90天
    if (start && end && end.diff(start, "days") > 90) {
      searchToast.warning("搜尋日期範圍不能超過90天");
      return;
    }

    // 更新篩選條件
    const updatedFilters = { ...filters, dateRange: [start, end] };
    setFilters(updatedFilters);
    onFilterChange({
      ...updatedFilters,
      startDate: start?.format('YYYY-MM-DD'),
      endDate: end?.format('YYYY-MM-DD'),
    });
  };

  // 處理關鍵字變更
  const handleKeywordChange = (e) => {
    const value = e.target.value;
    setFilters(prev => ({ ...prev, keyword: value }));  // 立即更新輸入框
    debouncedSearch(value);  // 延遲觸發搜尋
  };

  // 清理 debounce
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, []);

  // 處理價格範圍變更
  const handlePriceRangeChange = (value) => {
    console.log('=== 價格範圍變更 ===');
    console.log('選擇的價格範圍:', value);
    
    // 創建新的 URLSearchParams 實例
    const params = new URLSearchParams(searchParams.toString());
    
    // 更新過濾條件
    const newFilters = {
      ...initialFilters,
      keyword: params.get('keyword') || '',
      dateRange: [params.get('startDate'), params.get('endDate')],
      priceRange: value === 'all' ? '' : value, // 處理 'all' 的情況
      sortBy: params.get('sortBy') || 'date_desc',
      location: params.get('location') || 'all'
    };

    // 更新 URL 參數
    if (value && value !== 'all') {
      params.set('priceRange', value);
      console.log('設置價格範圍參數:', value);
    } else {
      params.delete('priceRange');
      console.log('清除價格範圍參數');
    }

    // 通知父組件更新過濾條件
    onFilterChange(newFilters);

    // 更新 URL
    const newUrl = `/camping/activities?${params.toString()}`;
    console.log('更新後的 URL:', newUrl);
    router.push(newUrl);
  };

  // 獲取當前價格範圍
  const currentPriceRange = searchParams.get('priceRange') || 'all';
  console.log('當前價格範圍:', currentPriceRange);

  // 修改清除處理函數
  const handleClear = (options = {}) => {
    const clearedFilters = {
      keyword: "",
      dateRange: [null, null],  // 確保日期範圍被清除
      minPrice: "",
      maxPrice: "",
      sortBy: options.keepSort ? 'date_desc' : 'date_desc',
      location: 'all'
    };
    setFilters(clearedFilters);
    onFilterChange({
      ...clearedFilters,
      startDate: null,  // 確保傳遞 null 給父組件
      endDate: null,    // 確保傳遞 null 給父組件
    });
  };

  // 修改 FilterTags 組件中的標籤移除處理
  const handleRemoveTag = (tagType) => {
    const updatedFilters = { ...filters };
    switch (tagType) {
      case 'keyword':
        updatedFilters.keyword = '';
        break;
      case 'date':
        updatedFilters.dateRange = [null, null];  // 清除日期範圍
        break;
      case 'price':
        updatedFilters.minPrice = '';
        updatedFilters.maxPrice = '';
        break;
      case 'all':
        return handleClear();
    }
    setFilters(updatedFilters);
    onFilterChange({
      ...updatedFilters,
      startDate: tagType === 'date' ? null : updatedFilters.startDate,  // 確保日期相關參數被清除
      endDate: tagType === 'date' ? null : updatedFilters.endDate,
    });
  };

  // 日期選擇器的預設選項
  const presets = [
    {
      label: '今天',
      value: [dayjs(), dayjs()]
    },
    {
      label: '明天',
      value: [dayjs().add(1, 'd'), dayjs().add(1, 'd')]
    },
    {
      label: '本週',
      value: [dayjs(), dayjs().endOf('week')]
    },
    {
      label: '下週',
      value: [
        dayjs().add(1, 'week').startOf('week'),
        dayjs().add(1, 'week').endOf('week')
      ]
    },
    {
      label: '本月',
      value: [dayjs(), dayjs().endOf('month')]
    }
  ];

  return (
    <>
      {isSearching && <Loading isLoading={isSearching} />}
      <ConfigProvider
        theme={{
          token: {
            fontFamily: "var(--font-zh)", // 使用 globals.css 中定義的中文字體
          },
          components: {
            DatePicker: {
              // 基礎顏色
              colorBgContainer: "#F8F8F8", // 背景色（淺灰白）
              colorPrimary: "#B6AD9A", // 主色調（淡褐色）
              colorBorder: "#E8E4DE", // 邊框（淺米色）
              colorText: "#7C7267", // 文字（淺褐灰）
              colorTextDisabled: "#D3CDC6", // 禁用文字（淺灰）
              colorBgContainerDisabled: "#F8F8F8", // 禁用背景

              // 輸入框外觀
              borderRadius: 8, // 圓角
              controlHeight: 40, // 高度

              // 輸入框 hover 和 focus 狀態
              hoverBorderColor: "#8C8275", // hover 邊框（深褐）
              hoverBg: "#F5F3F0", // hover 背景
              activeBorderColor: "#B6AD9A", // focus 邊框（淡褐色）
              controlOutline: "#8C827520", // focus 光圈
              controlOutlineWidth: 4, // 光圈寬度

              // 日期格子的狀態
              cellHoverBg: "#F5F3F0", // 日期 hover（淺褐）
              cellActiveWithRangeBg: "#E8E4DE", // 選中範圍（淺米色）
              cellHoverWithRangeBg: "#F5F3F0", // 範圍 hover（淺褐）
              cellRangeBorderColor: "#B6AD9A", // 範圍邊框
              
              // 選中狀態
              cellActiveBg: "#B6AD9A", // 選中背景（淡褐色）
              cellActiveTextColor: "#FFFFFF", // 選中文字（白色）

              // 今天標記
              cellActiveWithRangeBg: "#F5F3F0", // 範圍內的今天
              cellToday: "#B6AD9A", // 今天的標記顏色

              // 控制按鈕（月份切換等）
              controlItemBgActive: "#E8E4DE", // 控制項選中（淺米色）
              controlItemBgHover: "#F5F3F0", // 控制項 hover（淺褐）
            },
            InputNumber: {
              // 基礎顏色
              colorBgContainer: "#F8F8F8",
              colorPrimary: "#B6AD9A",  // 大地色主色
              colorBorder: "#E8E4DE",
              colorText: "#7C7267",
              colorTextDisabled: "#D3CDC6",
              colorBgContainerDisabled: "#F8F8F8",

              // 輸入框外觀
              borderRadius: 8,
              controlHeight: 40,

              // hover 和 focus 狀態
              hoverBorderColor: "#8C8275",  // 更深的大地色
              hoverBg: "#F5F3F0",          // hover 時的背景色
              activeBorderColor: "#B6AD9A", // focus 時的邊框顏色
              
              // focus 時的光圈效果
              controlOutline: "#8C827520",  // 使用更深的大地色，20% 透明度
              controlOutlineWidth: 4,
            },
            Select: {
              // Select 組件保持一致的樣式
              colorPrimary: "#B6AD9A",
              colorBorder: "#E8E4DE",
              hoverBorderColor: "#8C8275",
              hoverBg: "#F5F3F0",
              controlOutline: "#8C827520",
              controlOutlineWidth: 4,
            }
          },
        }}
        locale={locale}
      >
        <div className="bg-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100">
          <div className="flex flex-wrap items-center gap-3">
            {/* 關鍵字搜尋 - 加入防抖 */}
            <div className="relative group w-full md:w-[280px]">
              <input
                type="text"
                placeholder="搜尋活動名稱..."
                className="w-full px-4 py-2 rounded-lg border border-[#E8E4DE] text-[#7C7267] placeholder-gray-400 bg-[#F8F8F8] transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[#8C827520] focus:border-[#B6AD9A] hover:border-[#8C8275] hover:bg-[#F5F3F0] shadow-sm text-sm"
                value={filters.keyword}
                onChange={handleKeywordChange}
              />
              <FaSearch className="absolute right-3 top-3 text-gray-400 group-hover:text-[#8C8275] transition-colors duration-300" />
            </div>

            {/* 日期範圍選擇器 - 手機版全寬 */}
            <div className="w-full md:w-[260px]">
              <RangePicker
                value={filters.dateRange}
                onChange={handleDateChange}
                format="YYYY/MM/DD"
                placeholder={["開始日期", "結束日期"]}
                className="w-full hover:shadow-sm transition-shadow duration-300"
                allowClear
                showToday
                separator={
                  <span className="text-[#8C8275] px-2">→</span>
                }
                disabledDate={(current) => {
                  if (current && current < today) return true;
                  if (current && current > maxDate) return true;
                  return false;
                }}
                style={{
                  height: "42px",
                }}
                presets={presets}
              />
            </div>

            {/* 價格範圍選擇器 */}
            <div className="w-full md:w-[200px]">
              <Select
                className="w-full"
                placeholder="選擇價格範圍"
                value={currentPriceRange}
                onChange={handlePriceRangeChange}
                options={[
                  { label: '全部價格', value: 'all' },
                  { label: '2000元以下', value: '0-2000' },
                  { label: '2000-5000元', value: '2000-5000' },
                  { label: '5000-10000元', value: '5000-10000' },
                  { label: '10000元以上', value: '10000-up' }
                ]}
                style={{ height: '42px' }}
              />
            </div>
          </div>

          {/* 過濾標籤 */}
          <div className="mt-3">
            <FilterTags
              filters={filters}
              onRemoveTag={handleRemoveTag}
            />
          </div>
        </div>
        <ToastContainerComponent />
      </ConfigProvider>
    </>
  );
}
