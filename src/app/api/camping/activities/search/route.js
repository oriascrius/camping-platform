import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET: 搜尋活動
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const priceRange = searchParams.get('priceRange');

    console.log('=== 價格篩選請求 ===');
    console.log('收到的價格範圍:', priceRange);

    let query = `
      SELECT 
        sa.*,
        MIN(aso.price) as min_price,
        MAX(aso.price) as max_price,
        COUNT(DISTINCT aso.spot_id) as available_spots
      FROM spot_activities sa
      LEFT JOIN activity_spot_options aso ON sa.activity_id = aso.activity_id
      WHERE sa.is_active = 1
        AND sa.end_date >= CURDATE()
    `;

    const params = [];

    // 關鍵字搜尋
    if (keyword) {
      query += ` AND (sa.activity_name LIKE ? OR sa.description LIKE ?)`;
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    // 日期範圍
    if (startDate) {
      query += ` AND sa.start_date >= ?`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND sa.end_date <= ?`;
      params.push(endDate);
    }

    // 改善價格範圍處理
    if (priceRange && priceRange !== 'all') {
      console.log('處理價格範圍:', priceRange);
      const [min, max] = priceRange.split('-');
      console.log('解析後的範圍:', { min, max });

      // 在 WHERE 子句中先過濾
      if (min === '0') {
        query += ` AND aso.price <= ?`;
        params.push(parseInt(max));
      } else if (max === 'up') {
        query += ` AND aso.price >= ?`;
        params.push(parseInt(min));
      } else {
        query += ` AND aso.price BETWEEN ? AND ?`;
        params.push(parseInt(min), parseInt(max));
      }
    }

    // 分組
    query += ` GROUP BY sa.activity_id`;

    // 在 HAVING 子句中再次確認價格範圍
    if (priceRange && priceRange !== 'all') {
      const [min, max] = priceRange.split('-');
      if (min === '0') {
        query += ` HAVING max_price <= ?`;
        params.push(parseInt(max));
      } else if (max === 'up') {
        query += ` HAVING min_price >= ?`;
        params.push(parseInt(min));
      } else {
        query += ` HAVING min_price >= ? AND max_price <= ?`;
        params.push(parseInt(min), parseInt(max));
      }
    }

    query += ` ORDER BY sa.created_at DESC`;

    console.log('=== SQL 查詢 ===');
    console.log('Query:', query);
    console.log('Parameters:', params);

    const [activities] = await pool.query(query, params);
    console.log('查詢結果數量:', activities.length);
    console.log('價格範圍統計:', activities.map(a => ({
      id: a.activity_id,
      name: a.activity_name,
      min_price: a.min_price,
      max_price: a.max_price
    })));

    return NextResponse.json({ activities });

  } catch (error) {
    console.error('搜尋活動錯誤:', error);
    return NextResponse.json(
      { error: '搜尋活動失敗' },
      { status: 500 }
    );
  }
} 