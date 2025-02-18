'use client';
import { useSearchParams } from 'next/navigation';
import { FaTimes } from 'react-icons/fa';

export function FilterTags({ onRemoveTag }) {
  const searchParams = useSearchParams();
  
  // 排序方式對應的標籤文字
  const sortLabels = {
    'date_desc': '最新上架',
    'price_asc': '價格低到高',
    'price_desc': '價格高到低'
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

    // 地區篩選標籤
    const location = searchParams.get('location');
    if (location) {
      tags.push({ 
        key: 'location', 
        type: 'location',
        value: location,
        label: `地區: ${location === 'all' ? '全部地區' : location}` 
      });
    }

    // 排序方式標籤 - 移除 !== 'date_desc' 的條件，讓默認排序也顯示
    const sortBy = searchParams.get('sortBy');
    if (sortBy) {
      tags.push({
        key: 'sortBy',
        type: 'sortBy',
        value: sortBy,
        label: `排序: ${sortLabels[sortBy]}`
      });
    }

    return tags;
  };

  const activeTags = getActiveTags();

  // 如果沒有任何篩選條件，就不顯示標籤區域
  if (activeTags.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {activeTags.map(tag => (
        <div
          key={tag.key}
          className="flex items-center gap-2 px-3 py-1.5 
                   bg-[#E8E4DE] text-[#5D564D]
                   rounded-lg text-sm font-medium
                   shadow-md hover:shadow-lg
                   transition-all duration-200"
        >
          <span>{tag.label}</span>
          <button
            onClick={() => onRemoveTag(tag)}
            className="hover:text-[#8C8275] transition-colors"
          >
            <FaTimes className="w-3 h-3" />
          </button>
        </div>
      ))}
      {activeTags.length > 0 && (
        <button
          onClick={() => onRemoveTag('all')}
          className="px-3 py-1.5 
                   border border-[#D3CDC6]
                   text-[#5D564D] text-sm font-medium
                   rounded-lg
                   hover:border-[#8C8275] 
                   hover:text-[#8C8275]
                   hover:bg-[#F5F3F0]
                   transition-all duration-200
                   shadow-md hover:shadow-lg"
        >
          清除所有篩選
        </button>
      )}
    </div>
  );
} 