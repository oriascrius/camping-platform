import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET: 獲取活動列表
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get('location');

    let query = `
      SELECT 
        sa.*,
        MIN(aso.price) as min_price,
        MAX(aso.price) as max_price,
        SUM(aso.max_quantity) as total_spots,
        ca.address as camp_address,
        ca.name as camp_name
      FROM spot_activities sa
      LEFT JOIN activity_spot_options aso ON sa.activity_id = aso.activity_id
      LEFT JOIN camp_applications ca ON sa.application_id = ca.application_id
      WHERE sa.is_active = 1
        AND sa.end_date >= CURDATE()
    `;

    const params = [];

    // 處理地區篩選
    if (location && location !== 'all') {
      query += ` AND (
        ca.address LIKE ? OR 
        ca.address LIKE ? OR 
        ca.address LIKE ?
      )`;
      const locationPrefix = location.substring(0, 2);
      params.push(
        `${locationPrefix}%`,
        `%${locationPrefix}%`,
        `%${location}%`
      );
    }

    query += ` GROUP BY sa.activity_id`;

    // 添加排序
    query += ` ORDER BY sa.start_date ASC`;

    const [activities] = await pool.query(query, params);
    return NextResponse.json({ 
      success: true,
      activities: activities 
    });

  } catch (error) {
    console.error('獲取活動列表錯誤:', error);
    return NextResponse.json(
      { error: '獲取活動列表失敗' },
      { status: 500 }
    );
  }
} 