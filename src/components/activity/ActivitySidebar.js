'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaChevronDown } from 'react-icons/fa';

export function ActivitySidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [filters, setFilters] = useState({
    priceRange: searchParams.get('priceRange') || 'all',
    capacity: searchParams.get('capacity') || 'all',
    duration: searchParams.get('duration') || 'all',
    sortBy: searchParams.get('sortBy') || 'date_asc'
  });

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

    router.push(`/activities?${params.toString()}`);
  };

  return (
    <div className="w-64 bg-white rounded-lg shadow p-4 space-y-6">
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