import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET: 獲取單一活動詳情
export async function GET(request, { params }) {
  try {
    const [activities] = await pool.query(`
      SELECT 
        sa.*,
        GROUP_CONCAT(
          JSON_OBJECT(
            'option_id', aso.option_id,
            'spot_id', aso.spot_id,
            'price', aso.price,
            'max_quantity', aso.max_quantity,
            'spot_name', s.spot_name
          )
        ) as options
      FROM spot_activities sa
      LEFT JOIN activity_spot_options aso ON sa.activity_id = aso.activity_id
      LEFT JOIN spots s ON aso.spot_id = s.spot_id
      WHERE sa.activity_id = ?
      GROUP BY sa.activity_id
    `, [params.id]);

    if (!activities.length) {
      return NextResponse.json(
        { error: '找不到該活動' },
        { status: 404 }
      );
    }

    const activity = activities[0];
    activity.options = JSON.parse(`[${activity.options}]`);

    return NextResponse.json(activity);

  } catch (error) {
    console.error('獲取活動詳情錯誤:', error);
    return NextResponse.json(
      { error: '獲取活動詳情失敗' },
      { status: 500 }
    );
  }
} 