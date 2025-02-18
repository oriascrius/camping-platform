"use client";
// ===== React 相關引入 =====
import { useState, useEffect } from "react";                 // 引入 React 狀態管理和生命週期鉤子
import { useRouter, useSearchParams } from "next/navigation"; // 引入 Next.js 路由和參數處理工具

// ===== UI 組件和圖標引入 =====
import { FaSearch } from "react-icons/fa";                  // 引入搜尋圖標
import { DatePicker, ConfigProvider } from "antd";          // 引入 Ant Design 日期選擇器和全局配置
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

// ===== 組件常量定義 =====
const { RangePicker } = DatePicker;                        // 解構日期範圍選擇器組件

export function ActivitySearch({ onRemoveTag }) {
  const router = useRouter();
  const searchParams = useSearchParams();

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

  // 處理搜尋
  const handleSearch = async () => {
    // 驗證日期範圍完整性
    if ((filters.dateRange[0] && !filters.dateRange[1]) || 
        (!filters.dateRange[0] && filters.dateRange[1])) {
      // 使用 SweetAlert 顯示日期範圍錯誤
      await showSearchAlert.dateRangeError('請選擇完整的日期範圍');
      return;
    }

    // 驗證價格範圍邏輯
    if (filters.minPrice && filters.maxPrice && 
        Number(filters.minPrice) > Number(filters.maxPrice)) {
      // 使用 SweetAlert 顯示價格範圍錯誤
      await showSearchAlert.priceRangeError('最低價格不能大於最高價格');
      return;
    }

    try {
      const params = new URLSearchParams();
      
      // 添加關鍵字
      if (filters.keyword.trim()) {
        params.set('keyword', filters.keyword.trim());
      }

      // 添加日期範圍
      if (filters.dateRange[0] && filters.dateRange[1]) {
        params.set('startDate', filters.dateRange[0].format('YYYY-MM-DD'));
        params.set('endDate', filters.dateRange[1].format('YYYY-MM-DD'));
      }

      // 添加價格範圍
      if (filters.minPrice) params.set('minPrice', filters.minPrice);
      if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);

      // 更新 URL 並觸發搜尋
      router.push(`/camping/activities?${params.toString()}`);
      
      // 使用 Toast 顯示搜尋成功訊息
      searchToast.success('搜尋完成');
    } catch (error) {
      console.error('搜尋錯誤:', error);
      // 使用 SweetAlert 顯示系統錯誤
      await showSearchAlert.error('搜尋過程發生錯誤，請稍後再試');
    }
  };

  return (
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
            hoverBorderColor: "#C5BDB1", // hover 邊框（中淺褐）
            activeBorderColor: "#B6AD9A", // focus 邊框（淡褐色）

            // 日期格子的狀態
            cellHoverBg: "#E8E4DE", // 日期 hover（淺米色）
            cellActiveWithRangeBg: "#D3CDC6", // 選中範圍（淺灰）
            cellHoverWithRangeBg: "#E8E4DE", // 範圍 hover（淺米色）

            // 選中狀態
            activeBg: "#C5BDB1", // 選中背景（中淺褐）

            // 控制按鈕（月份切換等）
            controlItemBgActive: "#D3CDC6", // 控制項選中（淺灰）
            controlItemBgHover: "#E8E4DE", // 控制項 hover（淺米色）
          },
        },
      }}
      locale={locale}
    >
      <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* 關鍵字搜尋 */}
            <div className="relative group">
              <input
                type="text"
                placeholder="搜尋活動名稱..."
                className="w-full px-4 py-2.5 
                         rounded-lg
                         border border-gray-200
                         text-gray-700
                         placeholder-gray-400
                         transition-all duration-300
                         focus:ring-2 focus:ring-[#B6AD9A]/20
                         focus:border-[#B6AD9A]
                         hover:border-[#B6AD9A]/50
                         group-hover:shadow-sm"
                value={filters.keyword}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, keyword: e.target.value }))
                }
              />
              <FaSearch className="absolute right-3 top-3 text-gray-400 
                                 group-hover:text-[#B6AD9A]
                                 transition-colors duration-300" />
            </div>

            {/* 日期範圍選擇器 */}
            <div className="col-span-2">
              <RangePicker
                value={filters.dateRange}
                onChange={handleDateChange}
                format="YYYY/MM/DD"
                placeholder={["開始日期", "結束日期"]}
                className="w-full hover:shadow-sm transition-shadow duration-300"
                allowClear
                showToday
                disabledDate={(current) => {
                  if (current && current < today) return true;
                  if (current && current > maxDate) return true;
                  return false;
                }}
                style={{
                  height: "42px", // 稍微加高以匹配其他元素
                }}
              />
            </div>

            {/* 價格範圍 */}
            <div className="flex space-x-2">
              <input
                type="number"
                min="0"
                placeholder="最低價"
                className="w-1/2 px-4 py-2.5
                         rounded-lg
                         border border-gray-200
                         text-gray-700
                         placeholder-gray-400
                         transition-all duration-300
                         focus:ring-2 focus:ring-[#B6AD9A]/20
                         focus:border-[#B6AD9A]
                         hover:border-[#B6AD9A]/50
                         hover:shadow-sm"
                value={filters.minPrice}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, minPrice: e.target.value }))
                }
              />
              <input
                type="number"
                min={filters.minPrice || "0"}
                placeholder="最高價"
                className="w-1/2 px-4 py-2.5
                         rounded-lg
                         border border-gray-200
                         text-gray-700
                         placeholder-gray-400
                         transition-all duration-300
                         focus:ring-2 focus:ring-[#B6AD9A]/20
                         focus:border-[#B6AD9A]
                         hover:border-[#B6AD9A]/50
                         hover:shadow-sm"
                value={filters.maxPrice}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, maxPrice: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4">
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
              className="px-6 py-2.5 
                       rounded-lg
                       border border-[#B6AD9A]
                       text-[#7C7267]
                       transition-all duration-300
                       hover:bg-[#F5F3F0]
                       hover:border-[#8C8275]
                       hover:text-[#5D564D]
                       hover:shadow-md hover:shadow-[#B6AD9A]/20
                       active:shadow-sm
                       active:transform active:scale-95"
            >
              清除搜尋
            </button>
            <button
              type="submit"
              className="px-6 py-2.5
                       rounded-lg
                       bg-[#B6AD9A]
                       text-white
                       transition-all duration-300
                       hover:bg-[#8C8275]
                       hover:shadow-lg hover:shadow-[#B6AD9A]/30
                       active:bg-[#7C7267]
                       active:transform active:scale-95
                       focus:outline-none focus:ring-2
                       focus:ring-[#B6AD9A] focus:ring-offset-2"
            >
              搜尋
            </button>
          </div>
        </form>

        <div className="mt-4">
          <FilterTags onRemoveTag={onRemoveTag} />
        </div>
      </div>
      <ToastContainerComponent />
    </ConfigProvider>
  );
}
