import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET: 搜尋活動
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const location = searchParams.get('location');
    
    // 1. 檢查關鍵字長度
    if (keyword && (keyword.length < 2 || keyword.length > 50)) {
      return NextResponse.json(
        { error: '搜尋關鍵字長度必須在 2-50 個字元之間' },
        { status: 400 }
      );
    }

    // 2. 過濾特殊字元
    const sanitizedKeyword = keyword?.replace(/[<>{}[\]\\\/]/g, '');
    
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

    // 3. 關鍵字篩選
    if (sanitizedKeyword && sanitizedKeyword.trim()) {
      query += ` AND sa.activity_name LIKE ?`;
      params.push(`%${sanitizedKeyword.trim()}%`);
    }

    // 4. 日期範圍篩選
    if (startDate && endDate) {
      query += ` AND (
        (sa.start_date <= ? AND sa.end_date >= ?) OR
        (sa.start_date BETWEEN ? AND ?) OR
        (sa.end_date BETWEEN ? AND ?)
      )`;
      params.push(
        endDate, startDate,     // 活動期間包含搜尋範圍
        startDate, endDate,     // 活動開始日在搜尋範圍內
        startDate, endDate      // 活動結束日在搜尋範圍內
      );
    }

    // 5. 地區篩選
    if (location && location !== 'all') {
      query += ` AND sa.city = ?`;
      params.push(location);
    }

    // 分組
    query += ` GROUP BY sa.activity_id`;

    // 排序
    const sortBy = searchParams.get('sortBy') || 'date_desc';
    switch (sortBy) {
      case 'price_asc':
        query += ` ORDER BY min_price ASC`;
        break;
      case 'price_desc':
        query += ` ORDER BY max_price DESC`;
        break;
      case 'date_desc':
      default:
        query += ` ORDER BY sa.created_at DESC`;
        break;
    }

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