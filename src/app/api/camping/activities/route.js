import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET: 獲取活動列表
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    console.log('API 收到的參數:', {
      url: request.url,
      params: Object.fromEntries(searchParams.entries())
    });

    let query = `
      SELECT 
        sa.*,
        MIN(aso.price) as min_price,
        MAX(aso.price) as max_price,
        SUM(aso.max_quantity) as total_spots,
        ca.name as camp_name
      FROM spot_activities sa
      LEFT JOIN activity_spot_options aso ON sa.activity_id = aso.activity_id
      LEFT JOIN camp_applications ca ON sa.application_id = ca.application_id
      WHERE sa.is_active = 1
        AND sa.end_date >= CURDATE()
    `;

    const params = [];

    // 地區篩選 - 只檢查 city 欄位
    const location = searchParams.get('location');
    if (location && location !== 'all') {
      console.log('篩選地區:', location);
      query += ` AND sa.city = ?`;
      params.push(location);
    }

    // 排序處理
    const sortBy = searchParams.get('sortBy') || 'date_desc';
    switch (sortBy) {
      case 'price_asc':
        query += ` GROUP BY sa.activity_id ORDER BY min_price ASC, sa.start_date ASC`;
        break;
      case 'price_desc':
        query += ` GROUP BY sa.activity_id ORDER BY min_price DESC, sa.start_date ASC`;
        break;
      default: // date_desc
        query += ` GROUP BY sa.activity_id ORDER BY sa.start_date DESC, min_price ASC`;
    }

    // 在執行查詢前記錄完整的 SQL
    console.log('完整 SQL:', {
      query,
      params,
      location: searchParams.get('location')
    });

    const [activities] = await pool.query(query, params);
    console.log('查詢結果數量:', activities.length);

    return NextResponse.json({ 
      success: true,
      activities: activities 
    });

  } catch (error) {
    console.error('API 錯誤:', error);
    return NextResponse.json(
      { error: '獲取活動列表失敗' },
      { status: 500 }
    );
  }
} 