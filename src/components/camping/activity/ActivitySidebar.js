'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaChevronDown } from 'react-icons/fa';

export function ActivitySidebar({ onFilterChange, onTagChange }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [filters, setFilters] = useState({
    priceRange: searchParams.get('priceRange') || 'all',
    capacity: searchParams.get('capacity') || 'all',
    duration: searchParams.get('duration') || 'all',
    sortBy: searchParams.get('sortBy') || 'date_asc'
  });

  const [selectedLocation, setSelectedLocation] = useState('all');
  
  // 定義地區選項 - 分成兩列，只保留三字地名
  const locationOptions = [
    [
      { label: '新北市', value: '新北市' },
      { label: '桃園市', value: '桃園市' },
      { label: '新竹縣', value: '新竹縣' },
      { label: '宜蘭縣', value: '宜蘭縣' },
      { label: '苗栗縣', value: '苗栗縣' },
      { label: '台中市', value: '台中市' },
      { label: '南投縣', value: '南投縣' },
    ],
    [
      { label: '雲林縣', value: '雲林縣' },
      { label: '嘉義縣', value: '嘉義縣' },
      { label: '台南市', value: '台南市' },
      { label: '高雄市', value: '高雄市' },
      { label: '花蓮縣', value: '花蓮縣' },
      { label: '台東縣', value: '台東縣' },
    ]
  ];

  useEffect(() => {
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    
    if (minPrice || maxPrice) {
      let newPriceRange = 'all';
      
      if (minPrice && maxPrice) {
        if (parseInt(minPrice) >= 3000) {
          newPriceRange = '3000-up';
        } else if (parseInt(minPrice) >= 2000) {
          newPriceRange = '2000-3000';
        } else if (parseInt(minPrice) >= 1000) {
          newPriceRange = '1000-2000';
        } else {
          newPriceRange = '0-1000';
        }
      } else if (minPrice) {
        if (parseInt(minPrice) >= 3000) {
          newPriceRange = '3000-up';
        }
      }

      setFilters(prev => ({
        ...prev,
        priceRange: newPriceRange
      }));
    }
  }, [searchParams]);

  const priceRanges = [
    { label: '全部價格', value: 'all' },
    { label: '1000元以下', value: '0-1000' },
    { label: '1000-2000元', value: '1000-2000' },
    { label: '2000-3000元', value: '2000-3000' },
    { label: '3000元以上', value: '3000-up' }
  ];

  const capacityOptions = [
    { label: '不限人數', value: 'all' },
    { label: '2人以下', value: '1-2' },
    { label: '3-4人', value: '3-4' },
    { label: '5-6人', value: '5-6' },
    { label: '7人以上', value: '7-up' }
  ];

  const durationOptions = [
    { label: '不限天數', value: 'all' },
    { label: '1天', value: '1' },
    { label: '2天', value: '2' },
    { label: '3天', value: '3' },
    { label: '4天以上', value: '4-up' }
  ];

  const sortOptions = [
    { label: '日期：由近到遠', value: 'date_asc' },
    { label: '日期：由遠到近', value: 'date_desc' },
    { label: '價格：由低到高', value: 'price_asc' },
    { label: '價格：由高到低', value: 'price_desc' }
  ];

  const applyFilters = (newFilters) => {
    const params = new URLSearchParams(searchParams.toString());
    
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
    setSelectedLocation(value);
    
    // 更新 URL 參數
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') {
      params.delete('location');
    } else {
      params.set('location', value);
    }

    // 更新 URL 並觸發篩選
    const newUrl = params.toString() ? `?${params.toString()}` : '';
    router.push(`/camping/activities${newUrl}`);
    onFilterChange(value);
  };

  // 初始化選中狀態
  useEffect(() => {
    const location = searchParams.get('location');
    if (location) {
      setSelectedLocation(location);
      onFilterChange(location); // 確保初始篩選也生效
    }
  }, [searchParams]);

  return (
    <div className="w-64 bg-white rounded-lg shadow p-4 space-y-6">
      {/* 地區篩選 */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">地區</h3>
        
        {/* 全部地區選項 */}
        <div className="mb-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="location"
              value="all"
              checked={selectedLocation === 'all'}
              onChange={(e) => handleLocationChange(e.target.value)}
              className="text-green-600 focus:ring-green-500"
            />
            <span className="ml-2 text-gray-700">全部地區</span>
          </label>
        </div>

        {/* 地區選項 - 兩列布局 */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {locationOptions.map((column, columnIndex) => (
            <div key={columnIndex} className="space-y-2">
              {column.map(option => (
                <label key={option.value} className="flex items-center">
                  <input
                    type="radio"
                    name="location"
                    value={option.value}
                    checked={selectedLocation === option.value}
                    onChange={(e) => handleLocationChange(e.target.value)}
                    className="text-green-600 focus:ring-green-500"
                  />
                  <span className="ml-2 text-gray-700 text-sm">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* 排序選項 */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">排序方式</h3>
        <select
          className="w-full p-2 border rounded-md"
          value={filters.sortBy}
          onChange={(e) => {
            const newFilters = { ...filters, sortBy: e.target.value };
            setFilters(newFilters);
            applyFilters(newFilters);
          }}
        >
          {sortOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* 價格範圍 */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 flex items-center justify-between">
          價格範圍
          <FaChevronDown className="w-4 h-4 text-gray-400" />
        </h3>
        <div className="space-y-2">
          {priceRanges.map(option => (
            <label key={option.value} className="flex items-center">
              <input
                type="radio"
                name="priceRange"
                value={option.value}
                checked={filters.priceRange === option.value}
                onChange={(e) => {
                  const newFilters = {
                    ...filters,
                    priceRange: e.target.value
                  };
                  setFilters(newFilters);
                  applyFilters(newFilters);
                }}
                className="text-green-600 focus:ring-green-500"
              />
              <span className="ml-2 text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 人數選項 */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">營位人數</h3>
        <div className="space-y-2">
          {capacityOptions.map(option => (
            <label key={option.value} className="flex items-center">
              <input
                type="radio"
                name="capacity"
                value={option.value}
                checked={filters.capacity === option.value}
                onChange={(e) => {
                  const newFilters = { ...filters, capacity: e.target.value };
                  setFilters(newFilters);
                  applyFilters(newFilters);
                }}
                className="text-green-600 focus:ring-green-500"
              />
              <span className="ml-2 text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 天數選項 */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">活動天數</h3>
        <div className="space-y-2">
          {durationOptions.map(option => (
            <label key={option.value} className="flex items-center">
              <input
                type="radio"
                name="duration"
                value={option.value}
                checked={filters.duration === option.value}
                onChange={(e) => {
                  const newFilters = { ...filters, duration: e.target.value };
                  setFilters(newFilters);
                  applyFilters(newFilters);
                }}
                className="text-green-600 focus:ring-green-500"
              />
              <span className="ml-2 text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 重置按鈕 */}
      <button
        onClick={() => {
          const defaultFilters = {
            priceRange: 'all',
            capacity: 'all',
            duration: 'all',
            sortBy: 'date_asc'
          };
          setFilters(defaultFilters);
          applyFilters(defaultFilters);
        }}
        className="w-full py-2 text-sm text-gray-600 hover:text-gray-800"
      >
        重置所有篩選
      </button>
    </div>
  );
} 