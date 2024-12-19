import { notFound } from 'next/navigation';
import pool from '@/lib/db';
import { ActivityDetail } from '@/components/activity/ActivityDetail';
import { ActivityBookingForm } from '@/components/activity/ActivityBookingForm';

async function getActivity(id) {
  if (!id) return null;
  
  try {
    // 先獲取活動基本資訊，包括最低和最高價格
    const [activities] = await pool.query(`
      SELECT sa.*, 
        MIN(csa.price) as min_price,
        MAX(csa.price) as max_price
      FROM spot_activities sa
      LEFT JOIN activity_spot_options aso ON sa.activity_id = aso.activity_id
      LEFT JOIN camp_spot_applications csa ON aso.spot_id = csa.spot_id
      WHERE sa.activity_id = ?
      GROUP BY sa.activity_id
    `, [id]);

    if (!activities.length) {
      return null;
    }

    const activity = activities[0];

    // 獲取相關的營位選項和價格
    const [spots] = await pool.query(`
      SELECT 
        csa.spot_id,
        csa.name,
        csa.capacity,
        csa.price,
        csa.description,
        aso.option_id,
        aso.max_quantity
      FROM activity_spot_options aso
      JOIN camp_spot_applications csa ON aso.spot_id = csa.spot_id
      WHERE aso.activity_id = ? AND csa.status = 1
    `, [id]);

    // 添加營位資訊到活動物件
    activity.spots = spots;

    // 確保價格資訊存在
    if (!activity.min_price) {
      activity.min_price = Math.min(...spots.map(s => s.price)) || 0;
    }
    if (!activity.max_price) {
      activity.max_price = Math.max(...spots.map(s => s.price)) || 0;
    }

    return activity;

  } catch (error) {
    console.error('獲取活動詳情錯誤:', error);
    return null;
  }
}

// 頁面組件
export default async function ActivityPage({ params }) {
  // 確保 id 是有效的
  const activityId = parseInt(params?.id);
  if (!activityId) {
    notFound();
  }

  const activity = await getActivity(activityId);

  if (!activity) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <ActivityDetail activity={activity} />
        </div>
        <div>
          <ActivityBookingForm activity={activity} />
        </div>
      </div>
    </div>
  );
}

// 生成靜態參數
export async function generateStaticParams() {
  const [activities] = await pool.query('SELECT activity_id FROM spot_activities');
  return activities.map((activity) => ({
    id: activity.activity_id.toString(),
  }));
} 