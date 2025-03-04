'use client';
import { useSearchParams } from 'next/navigation';
import { FaTimes } from 'react-icons/fa';

export function FilterTags({ filters, onRemoveTag }) {
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
    
    // 關鍵字標籤
    if (filters.keyword) {
      tags.push({ 
        key: 'keyword', 
        type: 'keyword',
        value: filters.keyword,
        label: `關鍵字: ${filters.keyword}` 
      });
    }

    // 日期範圍標籤
    if (filters.dateRange?.[0] && filters.dateRange?.[1]) {
      // 格式化日期為更友善的格式
      const startDate = filters.dateRange[0].format('YYYY/MM/DD');
      const endDate = filters.dateRange[1].format('YYYY/MM/DD');
      
      // 判斷是否為同一天
      if (startDate === endDate) {
        tags.push({ 
          key: 'date', 
          type: 'date',
          value: filters.dateRange,
          label: `日期: ${startDate}` 
        });
      } else {
        tags.push({ 
          key: 'date', 
          type: 'date',
          value: filters.dateRange,
          label: `日期: ${startDate} → ${endDate}` 
        });
      }
    }

    // 地區標籤 - 只有當不是全部地區時才顯示
    const location = searchParams.get('location');
    if (location && location !== 'all') {
      tags.push({ 
        key: 'location', 
        type: 'location',
        value: location,
        label: `地區: ${location}` 
      });
    }

    // 排序方式標籤 - 保留顯示當前排序方式
    const sortBy = searchParams.get('sortBy') || 'date_desc';
    tags.push({ 
      key: 'sort', 
      type: 'sort',
      value: sortBy,
      label: sortLabels[sortBy] || '最新上架'
    });

    return tags;
  };

  const activeTags = getActiveTags();

  // 如果沒有任何篩選條件，就不顯示標籤區域
  if (activeTags.length === 0) return null;

  // 處理清除標籤的邏輯
  const handleRemoveTag = (tag) => {
    if (tag === 'all') {
      // 清除所有篩選條件，但保持排序為最新上架
      onRemoveTag({
        type: 'all',
        keepSort: true  // 添加標記，表示要保持排序
      });
      return;
    }
    
    onRemoveTag(tag);
  };

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
            onClick={() => handleRemoveTag(tag)}
            className="hover:text-[#8C8275] transition-colors"
          >
            <FaTimes className="w-3 h-3" />
          </button>
        </div>
      ))}
      {activeTags.length > 1 && (  // 修改條件，當有多於一個標籤時才顯示清除按鈕
        <button
          onClick={() => handleRemoveTag('all')}
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
          清除篩選
        </button>
      )}
    </div>
  );
} 