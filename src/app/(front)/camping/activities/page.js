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

// 定義默認篩選值
const DEFAULT_FILTERS = {
  location: 'all',
  sortBy: 'date_desc',
  keyword: '',
  dateRange: [null, null],
  minPrice: '',
  maxPrice: '',
};

export default function ActivitiesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState('grid');
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  // 初始化時設定默認參數
  useEffect(() => {
    // 只在首次加載且沒有任何參數時執行
    if (!searchParams.has('location') && !searchParams.has('sortBy')) {
      // 使用 replace 而不是 push，避免在瀏覽器歷史中新增記錄
      router.replace('/camping/activities?location=all&sortBy=date_desc', {
        scroll: false  // 防止頁面滾動
      });
    }
  }, []); // 空依賴數組，確保只執行一次

  // 監聽 URL 參數變化
  useEffect(() => {
    const location = searchParams.get('location') || 'all';
    const sortBy = searchParams.get('sortBy') || 'date_desc';
    
    setFilters(prev => ({
      ...prev,
      location,
      sortBy
    }));
  }, [searchParams]);

  // 處理篩選和排序
  const handleFilterChange = (newFilters) => {
    // 更新本地狀態
    setFilters(prev => ({ ...prev, ...newFilters }));

    // 更新 URL，但不重新加載頁面
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    // 使用 replace 並設置 shallow: true
    router.replace(`/camping/activities?${params.toString()}`, {
      scroll: false,
      shallow: true
    });
  };

  // 使用 SWR 獲取活動列表
  const { data, error, isLoading } = useSWR(
    '/api/camping/activities',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      dedupingInterval: 2000,
      keepPreviousData: true,
    }
  );

  // 篩選邏輯
  useEffect(() => {
    if (data?.activities) {
      let filtered = [...data.activities];

      // 地區篩選
      if (filters.location && filters.location !== 'all') {
        filtered = filtered.filter(activity => activity.city === filters.location);
      }

      // 排序處理
      filtered.sort((a, b) => {
        switch (filters.sortBy) {
          case 'date_desc':
            return new Date(b.created_at) - new Date(a.created_at);
          case 'price_asc':
            return a.min_price - b.min_price;
          case 'price_desc':
            return b.min_price - a.min_price;
          default:
            return 0;
        }
      });

      setFilteredActivities(filtered);
    }
  }, [data, filters]);

  // 監聽視窗大小變化
  useEffect(() => {
    // 處理視窗大小變化
    const handleResize = () => {
      // 如果螢幕寬度小於 768px (md breakpoint)，強制切換到網格視圖
      if (window.innerWidth < 768 && viewMode === 'list') {
        setViewMode('grid');
      }
    };

    // 添加事件監聽器
    window.addEventListener('resize', handleResize);
    
    // 初始檢查
    handleResize();

    // 清理事件監聽器
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [viewMode]); // 依賴於 viewMode，確保在視圖模式改變時也能正確處理

  // 處理載入狀態
  if (isLoading) return <Loading isLoading={isLoading} />;

  // 渲染主要內容
  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <ActivitySearch
          initialFilters={filters}
          onFilterChange={handleFilterChange}
        />
        
        {/* 手機版頂部控制列 */}
        <div className="md:hidden mt-4">
          <div className="flex items-center justify-between gap-2 bg-white px-3 py-0 rounded-lg shadow-sm">
            {/* 左側篩選按鈕 */}
            <div className="flex-1">
              <ActivitySidebar
                onFilterChange={handleFilterChange}
                activities={data?.activities}
                currentFilters={filters}
              />
            </div>

            {/* 右側視圖切換按鈕 - 只顯示網格視圖按鈕 */}
            <div className="flex gap-2">
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
            </div>
          </div>
        </div>

        {/* 桌面版視圖切換 */}
        <div className="hidden md:flex justify-end gap-2 mt-4">
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
            onFilterChange={handleFilterChange}
            activities={data?.activities}
            currentFilters={filters}
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
