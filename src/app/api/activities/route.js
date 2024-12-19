import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET: 獲取活動列表
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const offset = (page - 1) * limit;

    const [activities] = await pool.query(`
      SELECT 
        sa.*,
        MIN(aso.price) as min_price,
        MAX(aso.price) as max_price,
        SUM(aso.max_quantity) as total_spots
      FROM spot_activities sa
      LEFT JOIN activity_spot_options aso ON sa.activity_id = aso.activity_id
      WHERE sa.is_active = 1
        AND sa.end_date >= CURDATE()
      GROUP BY sa.activity_id
      ORDER BY sa.start_date ASC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    const [{ total }] = await pool.query(`
      SELECT COUNT(DISTINCT activity_id) as total 
      FROM spot_activities 
      WHERE is_active = 1 AND end_date >= CURDATE()
    `);

    return NextResponse.json({
      activities,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('獲取活動列表錯誤:', error);
    return NextResponse.json(
      { error: '獲取活動列表失敗' },
      { status: 500 }
    );
  }
} 