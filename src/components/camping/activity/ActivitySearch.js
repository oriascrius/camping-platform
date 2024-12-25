'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaSearch } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { FilterTags } from './FilterTags';

export function ActivitySearch({ initialFilters }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [filters, setFilters] = useState({
    keyword: searchParams.get('keyword') || '',
    startDate: searchParams.get('startDate') || '',
    endDate: searchParams.get('endDate') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || ''
  });

  // 當 URL 參數改變時更新表單
  useEffect(() => {
    setFilters({
      keyword: searchParams.get('keyword') || '',
      startDate: searchParams.get('startDate') || '',
      endDate: searchParams.get('endDate') || '',
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || ''
    });
  }, [searchParams]);

  const handleSearch = async (e) => {
    e.preventDefault();
    
    try {
      // 建立新的 URL 參數
      const params = new URLSearchParams(searchParams.toString());
      
      // 更新搜尋參數
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });

      // 保留其他現有的篩選參數（如側邊欄的篩選）
      router.push(`/camping/activities?${params.toString()}`);
      
    } catch (error) {
      console.error('搜尋錯誤:', error);
      toast.error('搜尋過程發生錯誤');
    }
  };

  const handleRemoveTag = (key) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (key === 'all') {
      // 清除所有篩選
      router.push('/camping/activities');
      setFilters({
        keyword: '',
        startDate: '',
        endDate: '',
        minPrice: '',
        maxPrice: ''
      });
    } else if (key === 'date') {
      // 清除日期範圍
      params.delete('startDate');
      params.delete('endDate');
      setFilters(prev => ({ ...prev, startDate: '', endDate: '' }));
    } else if (key === 'price') {
      // 清除價格範圍
      params.delete('minPrice');
      params.delete('maxPrice');
      setFilters(prev => ({ ...prev, minPrice: '', maxPrice: '' }));
    } else {
      // 清除單個篩選
      params.delete(key);
      setFilters(prev => ({ ...prev, [key]: '' }));
    }

    if (key !== 'all') {
      router.push(`/camping/activities?${params.toString()}`);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* 關鍵字搜尋 */}
          <div className="relative">
            <input
              type="text"
              placeholder="搜尋活動名稱..."
              className="w-full px-4 py-2 border rounded-lg"
              value={filters.keyword}
              onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
            />
            <FaSearch className="absolute right-3 top-3 text-gray-400" />
          </div>

          {/* 日期範圍 */}
          <div>
            <input
              type="date"
              className="w-full px-4 py-2 border rounded-lg"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
            />
          </div>
          <div>
            <input
              type="date"
              className="w-full px-4 py-2 border rounded-lg"
              value={filters.endDate}
              min={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
            />
          </div>

          {/* 價格範圍 */}
          <div className="flex space-x-2">
            <input
              type="number"
              min="0"
              placeholder="最低價"
              className="w-1/2 px-4 py-2 border rounded-lg"
              value={filters.minPrice}
              onChange={(e) => setFilters(prev => ({ ...prev, minPrice: e.target.value }))}
            />
            <input
              type="number"
              min={filters.minPrice || "0"}
              placeholder="最高價"
              className="w-1/2 px-4 py-2 border rounded-lg"
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
                startDate: '',
                endDate: '',
                minPrice: '',
                maxPrice: '',
              });
              router.push('/camping/activities');
            }}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            清除搜尋
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            搜尋
          </button>
        </div>
      </form>

      <div className="mt-4">
        <FilterTags onRemoveTag={handleRemoveTag} />
      </div>
    </div>
  );
} 