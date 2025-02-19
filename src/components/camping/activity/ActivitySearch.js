"use client";
// ===== React 相關引入 =====
import { useState, useEffect } from "react";                 // 引入 React 狀態管理和生命週期鉤子
import { useRouter, useSearchParams } from "next/navigation"; // 引入 Next.js 路由和參數處理工具

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

export function ActivitySearch({ onRemoveTag }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSearching, setIsSearching] = useState(false);  // 添加搜尋狀態

  // 設定日期限制
  const today = dayjs().startOf("day");
  const maxDate = dayjs().add(1, "year"); // 最多可以搜尋一年內的活動

  const [filters, setFilters] = useState({
    keyword: searchParams.get("keyword") || "",
    dateRange: [
      searchParams.get("startDate")
        ? dayjs(searchParams.get("startDate"))
        : null,
      searchParams.get("endDate") ? dayjs(searchParams.get("endDate")) : null,
    ],
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
  });

  // 當 URL 參數改變時更新表單
  useEffect(() => {
    setFilters({
      keyword: searchParams.get("keyword") || "",
      dateRange: [
        searchParams.get("startDate")
          ? dayjs(searchParams.get("startDate"))
          : null,
        searchParams.get("endDate") ? dayjs(searchParams.get("endDate")) : null,
      ],
      minPrice: searchParams.get("minPrice") || "",
      maxPrice: searchParams.get("maxPrice") || "",
    });
  }, [searchParams]);

  // 處理日期變更
  const handleDateChange = (dates) => {
    if (!dates || dates.length !== 2) {
      setFilters((prev) => ({ ...prev, dateRange: [null, null] }));
      return;
    }

    const [start, end] = dates;

    // 驗證日期範圍
    if (start && end) {
      // 檢查是否超過最大範圍（90天）
      if (end.diff(start, "days") > 90) {
        // 使用 Toast 顯示警告訊息
        searchToast.warning("搜尋日期範圍不能超過90天");
        return;
      }
    }

    setFilters((prev) => ({ ...prev, dateRange: [start, end] }));
  };

  // 預設價格範圍選項
  const priceRanges = [
    { label: '全部價格', value: 'all' },
    { label: '2000元以下', value: '0-2000' },
    { label: '2000-5000元', value: '2000-5000' },
    { label: '5000-10000元', value: '5000-10000' },
    { label: '10000元以上', value: '10000-up' }
  ];

  // 處理價格範圍變更
  const handlePriceRangeChange = (value) => {
    if (value === 'all') {
      setFilters(prev => ({ ...prev, minPrice: '', maxPrice: '' }));
      return;
    }

    const [min, max] = value.split('-');
    setFilters(prev => ({
      ...prev,
      minPrice: min,
      maxPrice: max === 'up' ? '' : max
    }));
  };

  // 取得目前選擇的價格範圍值
  const getCurrentPriceRange = () => {
    if (!filters.minPrice && !filters.maxPrice) return 'all';
    if (filters.minPrice === '0' && filters.maxPrice === '2000') return '0-2000';
    if (filters.minPrice === '2000' && filters.maxPrice === '5000') return '2000-5000';
    if (filters.minPrice === '5000' && filters.maxPrice === '10000') return '5000-10000';
    if (filters.minPrice === '10000' && !filters.maxPrice) return '10000-up';
    return 'custom';  // 自定義範圍
  };

  // 處理搜尋
  const handleSearch = async (e) => {
    e.preventDefault();
    setIsSearching(true);  // 顯示載入動畫

    try {
      // 驗證日期範圍完整性
      if ((filters.dateRange[0] && !filters.dateRange[1]) || 
          (!filters.dateRange[0] && filters.dateRange[1])) {
        await showSearchAlert.dateRangeError('請選擇完整的日期範圍');
        return;
      }

      // 驗證價格範圍邏輯
      if (filters.minPrice && filters.maxPrice && 
          Number(filters.minPrice) > Number(filters.maxPrice)) {
        await showSearchAlert.priceRangeError('最低價格不能大於最高價格');
        return;
      }

      // 3. 將搜尋條件轉換為 URL 參數
      const params = new URLSearchParams();
      if (filters.keyword.trim()) {
        params.set('keyword', filters.keyword.trim());  // 活動名稱關鍵字
      }

      // 2. 日期範圍
      if (filters.dateRange[0] && filters.dateRange[1]) {
        params.set('startDate', filters.dateRange[0].format('YYYY-MM-DD'));  // 開始日期
        params.set('endDate', filters.dateRange[1].format('YYYY-MM-DD'));    // 結束日期
      }

      // 3. 價格範圍
      if (filters.minPrice) params.set('minPrice', filters.minPrice);  // 最低價格
      if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);  // 最高價格

      // 4. 更新 URL
      router.push(`/camping/activities?${params.toString()}`);
      
      // 5. URL 更新會觸發 page.js 中的 SWR 重新獲取資料
      searchToast.success('搜尋完成');
    } catch (error) {
      console.error('搜尋錯誤:', error);
      await showSearchAlert.error('搜尋過程發生錯誤，請稍後再試');
    } finally {
      setIsSearching(false);  // 關閉載入動畫
    }
  };

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
          <form onSubmit={handleSearch}>
            {/* 搜尋區塊 */}
            <div className="flex flex-wrap items-center gap-3">
              {/* 關鍵字搜尋 */}
              <div className="relative group w-[280px]">
                <input
                  type="text"
                  placeholder="搜尋活動名稱..."
                  className="w-full px-4 py-2 
                           rounded-lg
                           border border-[#E8E4DE]
                           text-[#7C7267]
                           placeholder-gray-400
                           bg-[#F8F8F8]
                           transition-all duration-300
                           focus:outline-none
                           focus:ring-4 focus:ring-[#8C827520]
                           focus:border-[#B6AD9A]
                           hover:border-[#8C8275]
                           hover:bg-[#F5F3F0]
                           shadow-sm
                           text-sm"
                  value={filters.keyword}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, keyword: e.target.value }))
                  }
                />
                <FaSearch className="absolute right-3 top-3 text-gray-400 
                                   group-hover:text-[#8C8275]
                                   transition-colors duration-300" />
              </div>

              {/* 日期範圍選擇器 - 固定寬度 */}
              <div className="w-[260px]">
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
                  presets={[
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
                  ]}
                />
              </div>

              {/* 價格範圍選擇器 - 固定寬度 */}
              <div className="w-[200px]">
                <Select
                  className="w-full"
                  placeholder="選擇價格範圍"
                  value={getCurrentPriceRange()}
                  onChange={handlePriceRangeChange}
                  options={priceRanges}
                  popupMatchSelectWidth={false}
                  style={{ height: '42px' }}
                />
              </div>

              {/* 按鈕群組 */}
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => {
                    setFilters({
                      keyword: "",
                      dateRange: [null, null],
                      minPrice: "",
                      maxPrice: "",
                    });
                    router.push("/camping/activities");
                  }}
                  className="px-4 py-2.5 
                           rounded-lg
                           border border-[#B6AD9A]
                           text-[#7C7267]
                           transition-all duration-300
                           hover:bg-[#F5F3F0]
                           hover:border-[#8C8275]
                           hover:text-[#5D564D]"
                >
                  清除搜尋
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5
                           rounded-lg
                           bg-[#B6AD9A]
                           text-white
                           transition-all duration-300
                           hover:bg-[#8C8275]"
                >
                  搜尋
                </button>
              </div>
            </div>

            {/* 過濾標籤 */}
            <div className="mt-3">
              <FilterTags onRemoveTag={onRemoveTag} />
            </div>
          </form>
        </div>
        <ToastContainerComponent />
      </ConfigProvider>
    </>
  );
}
