import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET: 獲取單一活動詳情
export async function GET(request, { params }) {
  try {
    const activityId = parseInt(params.id);
    
    if (isNaN(activityId)) {
      return NextResponse.json(
        { error: '無效的活動ID' },
        { status: 400 }
      );
    }

    // 首先查詢活動基本資訊
    const [activities] = await pool.query(`
      SELECT 
        sa.*,
        ca.name as camp_name,
        ca.address as camp_address,
        ca.description as camp_description,
        ca.notice as camp_notice
      FROM spot_activities sa
      LEFT JOIN camp_applications ca ON sa.application_id = ca.application_id
      WHERE sa.activity_id = ? AND sa.is_active = 1
    `, [activityId]);

    if (!activities || activities.length === 0) {
      return NextResponse.json(
        { error: '活動不存在或已下架' },
        { status: 404 }
      );
    }

    // 修改營位查詢，移除 status 條件
    const [options] = await pool.query(`
      SELECT 
        aso.option_id,
        aso.spot_id,
        CAST(aso.price AS DECIMAL(10,0)) as price,
        aso.max_quantity,
        csa.name as spot_name,
        csa.description as spot_description,
        csa.capacity
      FROM activity_spot_options aso
      LEFT JOIN camp_spot_applications csa 
        ON aso.spot_id = csa.spot_id 
        AND aso.application_id = (
          SELECT application_id 
          FROM spot_activities 
          WHERE activity_id = ?
        )
      WHERE aso.activity_id = ?
    `, [activityId, activityId]);

    // 除錯用
    console.log('Activity:', activities[0]);
    console.log('Options:', options);

    const activity = activities[0];
    activity.options = options;

    // 計算價格範圍
    if (options.length > 0) {
      activity.min_price = Math.min(...options.map(opt => Number(opt.price)));
      activity.max_price = Math.max(...options.map(opt => Number(opt.price)));
    } else {
      activity.min_price = 0;
      activity.max_price = 0;
    }

    activity.campInfo = {
      name: activity.camp_name,
      address: activity.camp_address,
      description: activity.camp_description,
      notice: activity.camp_notice
    };

    return NextResponse.json(activity);

  } catch (error) {
    console.error('獲取活動詳情錯誤:', error);
    return NextResponse.json(
      { 
        error: '獲取活動詳情失敗',
        message: error.message,
        code: error.code 
      },
      { status: 500 }
    );
  }
} 