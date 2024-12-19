import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET: 搜尋活動
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');

    let query = `
      SELECT 
        sa.*,
        MIN(aso.price) as min_price,
        MAX(aso.price) as max_price
      FROM spot_activities sa
      LEFT JOIN activity_spot_options aso ON sa.activity_id = aso.activity_id
      WHERE sa.is_active = 1
        AND sa.end_date >= CURDATE()
    `;

    const params = [];

    if (keyword) {
      query += ` AND (sa.activity_name LIKE ? OR sa.description LIKE ?)`;
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    if (startDate) {
      query += ` AND sa.start_date >= ?`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND sa.end_date <= ?`;
      params.push(endDate);
    }

    if (minPrice) {
      query += ` AND aso.price >= ?`;
      params.push(minPrice);
    }

    if (maxPrice) {
      query += ` AND aso.price <= ?`;
      params.push(maxPrice);
    }

    query += ` GROUP BY sa.activity_id ORDER BY sa.start_date ASC`;

    const [activities] = await pool.query(query, params);

    return NextResponse.json({ activities });

  } catch (error) {
    console.error('搜尋活動錯誤:', error);
    return NextResponse.json(
      { error: '搜尋活動失敗' },
      { status: 500 }
    );
  }
} 