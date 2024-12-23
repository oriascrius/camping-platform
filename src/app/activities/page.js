import { ActivityList } from '@/components/activity/ActivityList';
import { ActivitySearch } from '@/components/activity/ActivitySearch';
import { ActivitySidebar } from '@/components/activity/ActivitySidebar';
import pool from '@/lib/db';
import { FilterTags } from '@/components/activity/FilterTags';

export default async function ActivitiesPage(props) {
  // 從 URL 中獲取所有查詢參數
  const currentSearchParams = props.searchParams;
  
  // 創建活動查詢參數，包含搜尋參數
  const activityParams = {
    keyword: String(currentSearchParams.keyword || ''),
    startDate: String(currentSearchParams.startDate || ''),
    endDate: String(currentSearchParams.endDate || ''),
    minPrice: String(currentSearchParams.minPrice || ''),
    maxPrice: String(currentSearchParams.maxPrice || ''),
    priceRange: String(currentSearchParams.priceRange || 'all'),
    capacity: String(currentSearchParams.capacity || 'all'),
    duration: String(currentSearchParams.duration || 'all'),
    sortBy: String(currentSearchParams.sortBy || 'date_asc')
  };

  // 獲取活動列表
  const activities = await getActivities(activityParams);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">露營活動</h1>
        <ActivitySearch initialFilters={activityParams} />
      </div>
      <div className="flex gap-6">
        <div className="hidden lg:block">
          <ActivitySidebar />
        </div>
        <div className="flex-1">
          <ActivityList activities={activities} />
        </div>
      </div>
    </div>
  );
}

// 修改 getActivities 函數以支援搜尋
async function getActivities({ keyword, startDate, endDate, minPrice, maxPrice, priceRange, capacity, duration, sortBy }) {
  try {
    let query = `
      SELECT 
        sa.*,
        MIN(aso.price) as min_price,
        MAX(aso.price) as max_price,
        SUM(aso.max_quantity) as total_spots
      FROM spot_activities sa
      LEFT JOIN activity_spot_options aso ON sa.activity_id = aso.activity_id
      WHERE sa.is_active = 1
        AND sa.end_date >= CURDATE()
    `;

    const queryParams = [];

    // 處理關鍵字搜尋
    if (keyword) {
      query += ` AND (sa.activity_name LIKE ? OR sa.description LIKE ?)`;
      queryParams.push(`%${keyword}%`, `%${keyword}%`);
    }

    // 處理日期範圍
    if (startDate) {
      query += ` AND sa.start_date >= ?`;
      queryParams.push(startDate);
    }
    if (endDate) {
      query += ` AND sa.end_date <= ?`;
      queryParams.push(endDate);
    }

    // 處理價格範圍（搜尋框）
    if (minPrice) {
      query += ` AND aso.price >= ?`;
      queryParams.push(parseInt(minPrice));
    }
    if (maxPrice) {
      query += ` AND aso.price <= ?`;
      queryParams.push(parseInt(maxPrice));
    }

    // 處理價格範圍（側邊欄）
    if (priceRange !== 'all') {
      const [min, max] = priceRange.split('-');
      if (min && max === 'up') {
        query += ` AND aso.price >= ?`;
        queryParams.push(parseInt(min));
      } else if (min && max) {
        query += ` AND aso.price BETWEEN ? AND ?`;
        queryParams.push(parseInt(min), parseInt(max));
      }
    }

    // 處理人數範圍
    if (capacity !== 'all') {
      const [min, max] = capacity.split('-');
      if (min && max === 'up') {
        query += ` AND aso.max_quantity >= ?`;
        queryParams.push(parseInt(min));
      } else if (min && max) {
        query += ` AND aso.max_quantity BETWEEN ? AND ?`;
        queryParams.push(parseInt(min), parseInt(max));
      }
    }

    // 處理天數
    if (duration !== 'all') {
      if (duration.includes('-up')) {
        query += ` AND DATEDIFF(sa.end_date, sa.start_date) >= ?`;
        queryParams.push(parseInt(duration));
      } else {
        query += ` AND DATEDIFF(sa.end_date, sa.start_date) = ?`;
        queryParams.push(parseInt(duration));
      }
    }

    // 處理排序
    switch (sortBy) {
      case 'date_desc':
        query += ` GROUP BY sa.activity_id ORDER BY sa.start_date DESC`;
        break;
      case 'price_asc':
        query += ` GROUP BY sa.activity_id ORDER BY MIN(aso.price) ASC`;
        break;
      case 'price_desc':
        query += ` GROUP BY sa.activity_id ORDER BY MIN(aso.price) DESC`;
        break;
      default:
        query += ` GROUP BY sa.activity_id ORDER BY sa.start_date ASC`;
    }

    const [activities] = await pool.query(query, queryParams);
    return activities;

  } catch (error) {
    console.error('獲取活動列表錯誤:', error);
    return [];
  }
} 