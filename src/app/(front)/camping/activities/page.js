"use client"; // 標記為客戶端組件
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ActivityList } from "@/components/camping/activity/ActivityList";
import { ActivitySearch } from "@/components/camping/activity/ActivitySearch";
import { ActivitySidebar } from "@/components/camping/activity/ActivitySidebar";
import useSWR from 'swr';
import Loading from "@/components/Loading";

// 定義 fetcher 函數，用於 SWR 發送請求
const fetcher = url => fetch(url).then(r => r.json());

export default function ActivitiesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  
  // 使用 URLSearchParams 的當前值作為 key
  const currentParams = searchParams.toString();
  
  // 使用 SWR 獲取活動列表
  const { data, error, isLoading } = useSWR(
    `/api/camping/activities?${currentParams}`,
    fetcher,
    {
      revalidateOnFocus: false,     // 避免切換視窗時重新請求
      revalidateIfStale: false,     // 避免快取過期時自動重新請求
      dedupingInterval: 2000,       // 相同請求的去重時間間隔
      keepPreviousData: true,       // 在新數據載入前保持顯示舊數據
    }
  );

  // 處理地區篩選功能
  const handleLocationFilter = (location) => {
    // 創建新的 URLSearchParams 實例
    const params = new URLSearchParams(currentParams);
    
    if (location === "all") {
      params.delete("location");
    } else {
      params.set("location", location);
    }

    // 使用 history.pushState 更新 URL，但不重新載入頁面
    const newUrl = `/camping/activities${params.toString() ? `?${params.toString()}` : ''}`;
    window.history.pushState({}, '', newUrl);

    // 直接觸發數據重新獲取
    if (data?.activities) {
      const filteredData = data.activities.filter(activity => 
        location === "all" || activity.city === location
      );
      setFilteredActivities(filteredData);
    }
  };

  // 處理篩選標籤 - 修改為單選模式
  const handleTagChange = (tag) => {
    // Implementation needed
  };

  // 處理移除篩選標籤
  const handleRemoveTag = (tag) => {
    const params = new URLSearchParams(searchParams.toString());

    if (tag === 'all') {
      // 清除所有篩選條件，但不重新載入頁面
      window.history.pushState({}, '', '/camping/activities');
      // 直接更新篩選後的數據
      if (data?.activities) {
        setFilteredActivities(data.activities);
      }
      return;
    }

    // 根據標籤類型移除對應的參數
    switch (tag.key) {
      case 'keyword':
        params.delete('keyword');
        break;
      case 'date':
        params.delete('startDate');
        params.delete('endDate');
        break;
      case 'location':
        params.delete('location');
        break;
      case 'sortBy':
        params.delete('sortBy');
        break;
      case 'price':
        params.delete('minPrice');
        params.delete('maxPrice');
        break;
    }

    // 使用 pushState 更新 URL，不重新載入頁面
    const newUrl = `/camping/activities${params.toString() ? `?${params.toString()}` : ''}`;
    window.history.pushState({}, '', newUrl);

    // 直接更新篩選後的數據
    if (data?.activities) {
      const filteredData = data.activities.filter(activity => {
        // 根據剩餘的參數進行篩選
        let matches = true;
        
        // 處理關鍵字篩選
        const keyword = params.get('keyword');
        if (keyword && !activity.name.toLowerCase().includes(keyword.toLowerCase())) {
          matches = false;
        }

        // 處理地區篩選
        const location = params.get('location');
        if (location && location !== 'all' && activity.city !== location) {
          matches = false;
        }

        // ... 其他篩選邏輯 ...

        return matches;
      });

      setFilteredActivities(filteredData);
    }
  };

  // 當數據更新時，更新活動列表
  useEffect(() => {
    if (data?.activities) {
      setFilteredActivities(data.activities);
    }
  }, [data]);

  // 處理載入狀態
  if (isLoading) return <Loading isLoading={isLoading} />;

  // 渲染主要內容
  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {/* 搜尋功能 */}
      <div className="mb-6">
        <ActivitySearch
          initialFilters={searchParams}
          onRemoveTag={handleRemoveTag}
        />
        
        {/* 手機版頂部控制列 */}
        <div className="md:hidden mt-4">
          <div className="flex items-center justify-between gap-2 bg-white p-2 rounded-lg shadow-md">
            {/* 左側篩選 */}
            <div className="flex-1">
              <ActivitySidebar
                onFilterChange={handleLocationFilter}
                onTagChange={handleTagChange}
              />
            </div>

            {/* 右側視圖切換按鈕 */}
            <div className="flex gap-2">
              {/* 網格視圖按鈕 */}
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all shadow-sm ${
                  viewMode === 'grid'
                    ? 'bg-[#B6AD9A] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              {/* 列表視圖按鈕 */}
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all shadow-sm ${
                  viewMode === 'list'
                    ? 'bg-[#B6AD9A] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* 桌面版視圖切換 */}
        <div className="hidden lg:flex justify-end gap-2 mt-4">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-all ${
              viewMode === 'grid'
                ? 'bg-[#B6AD9A] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-all ${
              viewMode === 'list'
                ? 'bg-[#B6AD9A] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* 主要內容區域 */}
      <div className="flex gap-6">
        {/* 桌面版側邊欄 */}
        <div className="hidden md:block">
          <ActivitySidebar
            onFilterChange={handleLocationFilter}
            onTagChange={handleTagChange}
          />
        </div>
        {/* 活動列表 */}
        <div className="flex-1">
          <ActivityList 
            activities={filteredActivities} 
            viewMode={viewMode}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
