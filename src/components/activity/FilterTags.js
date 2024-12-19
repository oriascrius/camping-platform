'use client';
import { useSearchParams } from 'next/navigation';
import { FaTimes } from 'react-icons/fa';

export function FilterTags({ onRemoveTag }) {
  const searchParams = useSearchParams();
  
  // 價格範圍轉換
  const formatPriceRange = (range) => {
    const [min, max] = range.split('-');
    if (max === 'up') return `${min}元以上`;
    if (min && max) return `${min}-${max}元`;
    return range;
  };

  // 人數範圍轉換
  const formatCapacity = (capacity) => {
    const [min, max] = capacity.split('-');
    if (max === 'up') return `${min}人以上`;
    if (min && max) return `${min}-${max}人`;
    return capacity;
  };

  // 天數轉換
  const formatDuration = (duration) => {
    if (duration.includes('-up')) {
      return `${duration.split('-')[0]}天以上`;
    }
    return `${duration}天`;
  };

  // 取得所有篩選條件
  const getActiveTags = () => {
    const tags = [];
    
    // 關鍵字
    const keyword = searchParams.get('keyword');
    if (keyword) {
      tags.push({ key: 'keyword', label: `關鍵字: ${keyword}` });
    }

    // 日期範圍
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    if (startDate && endDate) {
      tags.push({ key: 'date', label: `日期: ${startDate} ~ ${endDate}` });
    } else if (startDate) {
      tags.push({ key: 'startDate', label: `開始日期: ${startDate}` });
    } else if (endDate) {
      tags.push({ key: 'endDate', label: `結束日期: ${endDate}` });
    }

    // 價格範圍 - 優先顯示搜尋框的價格範圍
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const priceRange = searchParams.get('priceRange');
    
    if (minPrice || maxPrice) {
      // 顯示搜尋框的價格範圍
      if (minPrice && maxPrice) {
        tags.push({ key: 'price', label: `價格: ${minPrice}-${maxPrice}元` });
      } else if (minPrice) {
        tags.push({ key: 'minPrice', label: `最低價: ${minPrice}元` });
      } else if (maxPrice) {
        tags.push({ key: 'maxPrice', label: `最高價: ${maxPrice}元` });
      }
    } else if (priceRange && priceRange !== 'all') {
      // 只有在沒有搜尋框價格時才顯示側邊欄價格範圍
      tags.push({ key: 'priceRange', label: `價格範圍: ${formatPriceRange(priceRange)}` });
    }

    // 人數
    const capacity = searchParams.get('capacity');
    if (capacity && capacity !== 'all') {
      tags.push({ key: 'capacity', label: `人數: ${formatCapacity(capacity)}` });
    }

    // 天數
    const duration = searchParams.get('duration');
    if (duration && duration !== 'all') {
      tags.push({ key: 'duration', label: `天數: ${formatDuration(duration)}` });
    }

    return tags;
  };

  const activeTags = getActiveTags();

  if (activeTags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {activeTags.map(tag => (
        <div
          key={tag.key}
          className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
        >
          <span>{tag.label}</span>
          <button
            onClick={() => onRemoveTag(tag.key)}
            className="hover:text-green-600"
          >
            <FaTimes className="w-3 h-3" />
          </button>
        </div>
      ))}
      {activeTags.length > 0 && (
        <button
          onClick={() => onRemoveTag('all')}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          清除所有篩選
        </button>
      )}
    </div>
  );
} 