'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaMapMarkerAlt, FaDollarSign, FaSortAmountDown, FaCompass, FaChevronLeft } from 'react-icons/fa';
import { MdOutlineLocalOffer } from 'react-icons/md';
import { TbMountain, TbBeach, TbTrees, TbSunset, TbCampfire } from 'react-icons/tb';
import { Tooltip, Popover } from 'antd';

export function ActivitySidebar({ onFilterChange, onTagChange }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // 初始化時設置默認值
  const [filters, setFilters] = useState({
    sortBy: searchParams.get('sortBy') || 'date_desc'
  });

  const [selectedTags, setSelectedTags] = useState({
    location: searchParams.get('location') || 'all',
    features: new Set(),
  });

  // 添加區域圖標定義
  const regionIcons = {
    '北部': <FaCompass className="text-blue-500 w-3 h-3" />,
    '中部': <TbMountain className="text-emerald-500 w-3 h-3" />,
    '南部': <TbBeach className="text-amber-500 w-3 h-3" />,
    '東部': <TbSunset className="text-rose-500 w-3 h-3" />
  };


  // 地區選項 - 依區域分組
  const locationGroups = [
    {
      title: '北部',
      items: [
        { label: '台北市', value: '台北' },
        { label: '新北市', value: '新北' },
        { label: '桃園市', value: '桃園' },
      ]
    },
    {
      title: '中部',
      items: [
        { label: '苗栗縣', value: '苗栗' },
        { label: '台中市', value: '台中' },
        { label: '南投縣', value: '南投' },
      ]
    },
    {
      title: '南部',
      items: [
        { label: '嘉義縣', value: '嘉義' },
        { label: '台南市', value: '台南' },
        { label: '高雄市', value: '高雄' },
      ]
    },
    {
      title: '東部',
      items: [
        { label: '宜蘭縣', value: '宜蘭' },
        { label: '花蓮縣', value: '花蓮' },
        { label: '台東縣', value: '台東' },
      ]
    }
  ];

  // 排序選項
  const sortOptions = [
    { label: '最新上架', value: 'date_desc' },
    { label: '價格低到高', value: 'price_asc' },
    { label: '價格高到低', value: 'price_desc' }
  ];

  // 處理標籤選擇
  const handleTagSelect = (type, value) => {
    const newTags = { ...selectedTags };
    
    if (type === 'location') {
      newTags.location = value;
      handleLocationChange(value);
    } else if (type === 'features') {
      const features = new Set(newTags.features);
      if (features.has(value)) {
        features.delete(value);
      } else {
        features.add(value);
      }
      newTags.features = features;
    }
    
    setSelectedTags(newTags);
  };

  const applyFilters = (newFilters) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // 處理價格範圍
    params.delete('minPrice');
    params.delete('maxPrice');
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {  // 移除 value !== 'all' 的判斷
        params.set(key, value);
        
        if (key === 'priceRange') {
          const [min, max] = value.split('-');
          if (max === 'up') {
            params.set('minPrice', min);
          } else {
            params.set('minPrice', min);
            params.set('maxPrice', max);
          }
        }
      } else {
        params.delete(key);
      }
    });

    router.push(`/camping/activities?${params.toString()}`);
  };

  const handleLocationChange = (value) => {
    // 避免重複選擇相同的值
    if (selectedTags.location === value) return;
    
    setSelectedTags(prev => ({
      ...prev,
      location: value
    }));
    
    const params = new URLSearchParams(searchParams.toString());
    
    if (value === 'all') {
      params.delete('location');
    } else {
      params.set('location', value);
    }

    // 使用 replace 並添加 options
    router.replace(
      `/camping/activities${params.toString() ? `?${params.toString()}` : ''}`,
      {
        scroll: false,
        shallow: true
      }
    );
    
    // 通知父組件
    onFilterChange(value);
  };

  // 修改標籤顯示邏輯
  const getLocationLabel = (value) => {
    if (value === 'all') return '全部地區';
    const location = locationGroups
      .flatMap(g => g.items)
      .find(i => i.value === value);
    return location ? location.label : value;
  };

  // 初始化時設置 URL 參數
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    
    // 如果 URL 中沒有這些參數，則設置默認值
    if (!params.has('location')) {
      params.set('location', 'all');
    }
    if (!params.has('sortBy')) {
      params.set('sortBy', 'date_desc');
    }

    // 只有當 URL 需要更新時才進行跳轉
    if (!searchParams.has('location') || !searchParams.has('sortBy')) {
      router.push(`/camping/activities?${params.toString()}`);
    }
  }, []);

  // 監聽螢幕寬度變化
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // 初始化
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      {/* 手機版頂部過濾欄 */}
      <div className="block md:hidden">
        <div className="flex items-center gap-2 p-3 overflow-x-auto hide-scrollbar">
          {/* 地區選擇按鈕 */}
          <Popover
            placement="bottomLeft"
            content={
              <div className="w-64 max-h-[400px] overflow-y-auto">
                {locationGroups.map(group => (
                  <div key={group.title} className="mb-3 last:mb-0">
                    <div className="flex items-center gap-1.5 text-sm font-medium text-gray-500 mb-2">
                      {regionIcons[group.title]}
                      {group.title}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {group.items.map(option => (
                        <button
                          key={option.value}
                          onClick={() => handleTagSelect('location', option.value)}
                          className={`
                            px-2.5 py-1.5 rounded-md text-sm
                            transition-all duration-200
                            hover:bg-gray-50
                            ${selectedTags.location === option.value
                              ? 'bg-blue-50 text-blue-600 font-medium'
                              : 'text-gray-600'
                            }
                          `}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            }
          >
            <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white text-sm text-gray-700 shadow-md hover:shadow-lg transition-all duration-200">
              <FaMapMarkerAlt className="text-blue-500 w-4 h-4" />
              {selectedTags.location === 'all' ? '選擇地區' : locationGroups
                .flatMap(g => g.items)
                .find(i => i.value === selectedTags.location)?.label}
            </button>
          </Popover>

          {/* 排序方式按鈕 */}
          <Popover
            placement="bottomLeft"
            content={
              <div className="w-48">
                {sortOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => {
                      const newFilters = { ...filters, sortBy: option.value };
                      setFilters(newFilters);
                      applyFilters(newFilters);
                    }}
                    className={`
                      w-full px-3 py-2 text-sm
                      flex items-center justify-between
                      rounded-lg transition-all duration-200
                      hover:bg-gray-50
                      ${filters.sortBy === option.value
                        ? 'bg-purple-50 text-purple-600 font-medium'
                        : 'text-gray-600'
                      }
                    `}
                  >
                    <span>{option.label}</span>
                    {filters.sortBy === option.value && (
                      <TbTrees className="text-purple-500 w-4 h-4" />
                    )}
                  </button>
                ))}
              </div>
            }
          >
            <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white text-sm text-gray-700 shadow-md hover:shadow-lg transition-all duration-200">
              <FaSortAmountDown className="text-purple-500 w-4 h-4" />
              {sortOptions.find(opt => opt.value === filters.sortBy)?.label}
            </button>
          </Popover>
        </div>
      </div>

      {/* 桌面版側邊欄 */}
      <div className={`
        fixed md:relative
        top-0 left-0 h-full
        transition-all duration-300 ease-in-out
        bg-white rounded-lg shadow-sm border border-gray-100
        hidden md:block
        ${isCollapsed ? 'w-16 translate-x-0' : 'w-60 translate-x-0'}
      `}>
        {/* 收合按鈕 */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`
            absolute -right-3 top-4
            w-6 h-6
            flex items-center justify-center
            bg-white rounded-full
            border border-gray-200
            shadow-sm
            text-gray-500
            hover:text-gray-700
            hover:shadow-md
            z-[101]
            transition-all duration-300
            ${isCollapsed ? 'rotate-180' : ''}
          `}
        >
          <FaChevronLeft size={12} />
        </button>

        {/* 展開時的內容 */}
        <div className={`
          p-4 space-y-6
          ${isCollapsed ? 'hidden' : 'block'}
          transition-opacity duration-200
        `}>
          {/* 地區選擇 */}
          <div className="location-section">
            <div className="flex items-center justify-between mb-3">
              <h3 className="flex items-center gap-2 text-base font-medium text-gray-900">
                <FaMapMarkerAlt className="text-blue-500 w-4 h-4" />
                地區選擇
              </h3>
              <button
                onClick={() => handleTagSelect('location', 'all')}
                className={`
                  px-2 py-0.5 text-sm
                  rounded-md transition-all duration-200
                  ${selectedTags.location === 'all'
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                  }
                `}
              >
                全部地區
              </button>
            </div>

            <div className="space-y-3">
              {locationGroups.map(group => (
                <div key={group.title}>
                  <Tooltip title={`查看${group.title}營地`} placement="right">
                    <h4 className="flex items-center gap-1.5 text-sm font-medium text-gray-500 mb-1.5">
                      {regionIcons[group.title]}
                      {!isCollapsed && group.title}
                    </h4>
                  </Tooltip>
                  {!isCollapsed && (
                    <div className="flex flex-wrap gap-1">
                      {group.items.map(option => (
                        <Tooltip key={option.value} title={`查看${option.label}營地`}>
                          <button
                            onClick={() => handleTagSelect('location', option.value)}
                            className={`
                              px-2 py-0.5 rounded-md text-sm transition-all duration-200
                              whitespace-nowrap
                              border border-transparent
                              hover:bg-gray-50
                              active:scale-95
                              ${selectedTags.location === option.value
                                ? 'bg-blue-50 text-blue-600 font-medium'
                                : 'text-gray-600'
                              }
                            `}
                          >
                            {option.label}
                          </button>
                        </Tooltip>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 排序方式 */}
          <div className="sort-section">
            <h3 className="flex items-center gap-1.5 text-sm font-medium text-gray-900 mb-3">
              <FaSortAmountDown className="text-purple-500 w-3.5 h-3.5" />
              排序方式
            </h3>
            <div className="space-y-1">
              {sortOptions.map(option => (
                <Tooltip key={option.value} title={`依${option.label}排序`}>
                  <button
                    onClick={() => {
                      const newFilters = { ...filters, sortBy: option.value };
                      setFilters(newFilters);
                      applyFilters(newFilters);
                    }}
                    className={`
                      w-full px-3 py-2 rounded-lg text-sm transition-all duration-200
                      flex items-center justify-between
                      border border-transparent
                      hover:border-gray-200 hover:bg-gray-50
                      hover:shadow-sm hover:scale-102
                      active:scale-98
                      ${filters.sortBy === option.value
                        ? 'bg-purple-50 text-purple-600 font-medium border-purple-200 shadow-sm'
                        : 'text-gray-600'
                      }
                    `}
                  >
                    <span>{option.label}</span>
                    <TbTrees className={filters.sortBy === option.value ? 'text-purple-500' : 'text-gray-400'} />
                  </button>
                </Tooltip>
              ))}
            </div>
          </div>

          {/* 已選擇的篩選條件 */}
          {/* {!isCollapsed && selectedTags.location !== 'all' && (
            <div className="pt-3 border-t border-gray-100">
              <div className="text-xs text-gray-500 space-y-1">
                {selectedTags.location !== 'all' && (
                  <div className="flex items-center gap-1 text-blue-600">
                    <FaMapMarkerAlt className="w-3 h-3" />
                    <span>{locationGroups.flatMap(g => g.items).find(i => i.value === selectedTags.location)?.label}</span>
                  </div>
                )}
              </div>
            </div>
          )} */}
        </div>

        {/* 收合時的圖標列表 */}
        {isCollapsed && (
          <div className="py-4 flex flex-col items-center space-y-4">
            {/* 地區選擇 */}
            <Popover
              placement="rightTop"
              trigger="click"
              content={
                <div className="w-64 max-h-[400px] overflow-y-auto">
                  {locationGroups.map(group => (
                    <div key={group.title} className="mb-3 last:mb-0">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-gray-500 mb-2">
                        {regionIcons[group.title]}
                        {group.title}
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {group.items.map(option => (
                          <button
                            key={option.value}
                            onClick={() => handleTagSelect('location', option.value)}
                            className={`
                              px-2.5 py-1.5 rounded-md text-sm
                              transition-all duration-200
                              hover:bg-gray-50
                              ${selectedTags.location === option.value
                                ? 'bg-blue-50 text-blue-600 font-medium'
                                : 'text-gray-600'
                              }
                            `}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              }
            >
              <div className="p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                <FaMapMarkerAlt className="text-blue-500 w-5 h-5" />
              </div>
            </Popover>

            {/* 排序方式 */}
            <Popover
              placement="rightTop"
              trigger="click"
              content={
                <div className="w-48">
                  {sortOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => {
                        const newFilters = { ...filters, sortBy: option.value };
                        setFilters(newFilters);
                        applyFilters(newFilters);
                      }}
                      className={`
                        w-full px-3 py-2 text-sm
                        flex items-center justify-between
                        rounded-lg transition-all duration-200
                        hover:bg-gray-50
                        ${filters.sortBy === option.value
                          ? 'bg-purple-50 text-purple-600 font-medium'
                          : 'text-gray-600'
                        }
                      `}
                    >
                      <span>{option.label}</span>
                      {filters.sortBy === option.value && (
                        <TbTrees className="text-purple-500 w-4 h-4" />
                      )}
                    </button>
                  ))}
                </div>
              }
            >
              <div className="p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                <FaSortAmountDown className="text-purple-500 w-5 h-5" />
              </div>
            </Popover>
          </div>
        )}
      </div>
    </>
  );
}

// 添加全局樣式到 globals.css
/*
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
*/ 