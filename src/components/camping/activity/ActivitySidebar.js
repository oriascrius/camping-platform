'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaMapMarkerAlt, FaDollarSign, FaSortAmountDown, FaCompass } from 'react-icons/fa';
import { MdOutlineLocalOffer } from 'react-icons/md';
import { TbMountain, TbBeach, TbTrees, TbSunset, TbCampfire } from 'react-icons/tb';
import { Tooltip } from 'antd';

export function ActivitySidebar({ onFilterChange, onTagChange }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState({
    priceRange: searchParams.get('priceRange') || 'all',
    sortBy: searchParams.get('sortBy') || 'date_desc'
  });

  const [selectedTags, setSelectedTags] = useState({
    location: 'all',
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
        { label: '新北市', value: '新北市' },
        { label: '桃園市', value: '桃園市' },
        { label: '新竹縣', value: '新竹縣' },
      ]
    },
    {
      title: '中部',
      items: [
        { label: '苗栗縣', value: '苗栗縣' },
        { label: '台中市', value: '台中市' },
        { label: '南投縣', value: '南投縣' },
      ]
    },
    {
      title: '南部',
      items: [
        { label: '嘉義縣', value: '嘉義縣' },
        { label: '台南市', value: '台南市' },
        { label: '高雄市', value: '高雄市' },
      ]
    },
    {
      title: '東部',
      items: [
        { label: '宜蘭縣', value: '宜蘭縣' },
        { label: '花蓮縣', value: '花蓮縣' },
        { label: '台東縣', value: '台東縣' },
      ]
    }
  ];

  // 價格範圍
  const priceRanges = [
    { label: '3000元以下', value: '0-3000' },
    { label: '3000-5000元', value: '3000-5000' },
    { label: '5000元以上', value: '5000-up' }
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
      if (value && value !== 'all') {
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

    router.push(`/camping/activities${params.toString() ? `?${params.toString()}` : ''}`);
    onFilterChange(value);
  };

  // 初始化選中狀態
  useEffect(() => {
    const location = searchParams.get('location');
    if (location) {
      setSelectedTags(prev => ({
        ...prev,
        location: location
      }));
      onFilterChange(location);
    }
  }, [searchParams]);

  return (
    <div className="w-60 space-y-6 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
      {/* 地區選擇 */}
      <div>
        <h3 className="flex items-center gap-2 text-base font-medium text-gray-900 mb-3">
          <FaMapMarkerAlt className="text-blue-500 w-4 h-4" />
          地區選擇
        </h3>
        <div className="space-y-3">
          {locationGroups.map(group => (
            <div key={group.title}>
              <Tooltip title={`查看${group.title}營地`}>
                <h4 className="flex items-center gap-1.5 text-sm font-medium text-gray-500 mb-1.5">
                  {regionIcons[group.title]}
                  {group.title}
                </h4>
              </Tooltip>
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
            </div>
          ))}
        </div>
      </div>

      {/* 價格範圍 */}
      <div>
        <h3 className="flex items-center gap-1.5 text-sm font-medium text-gray-900 mb-3">
          <FaDollarSign className="text-green-500 w-3.5 h-3.5" />
          價格範圍
        </h3>
        <div className="space-y-1">
          {priceRanges.map(option => (
            <Tooltip key={option.value} title={`選擇${option.label}的營地`}>
              <button
                onClick={() => {
                  const newFilters = { ...filters, priceRange: option.value };
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
                  ${filters.priceRange === option.value
                    ? 'bg-green-50 text-green-600 font-medium border-green-200 shadow-sm'
                    : 'text-gray-600'
                  }
                `}
              >
                <span>{option.label}</span>
                <MdOutlineLocalOffer className={filters.priceRange === option.value ? 'text-green-500' : 'text-gray-400'} />
              </button>
            </Tooltip>
          ))}
        </div>
      </div>

      {/* 排序方式 */}
      <div>
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
      {(selectedTags.location !== 'all' || filters.priceRange !== 'all') && (
        <div className="pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-500 space-y-1">
            {selectedTags.location !== 'all' && (
              <div className="flex items-center gap-1 text-blue-600">
                <FaMapMarkerAlt className="w-3 h-3" />
                <span>{locationGroups.flatMap(g => g.items).find(i => i.value === selectedTags.location)?.label}</span>
              </div>
            )}
            {filters.priceRange !== 'all' && (
              <div className="flex items-center gap-1 text-green-600">
                <FaDollarSign className="w-3 h-3" />
                <span>{priceRanges.find(p => p.value === filters.priceRange)?.label}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 