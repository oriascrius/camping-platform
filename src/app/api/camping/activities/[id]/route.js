import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET: 獲取單一活動詳情
export async function GET(request, context) {
  try {
    // 先等待整個 params 物件
    const params = await context.params;
    const id = params.id;
    
    const activityId = parseInt(id);
    
    if (isNaN(activityId)) {
      return NextResponse.json(
        { error: '無效的活動 ID' },
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

    // 修改營位查詢，考慮已預訂的數量
    const [options] = await pool.query(`
      SELECT 
        aso.option_id,
        aso.spot_id,
        CAST(aso.price AS DECIMAL(10,0)) as price,
        CASE 
          WHEN aso.max_quantity <= 0 THEN 0 
          ELSE (
            aso.max_quantity - COALESCE(
              (SELECT SUM(b.quantity)
               FROM bookings b
               WHERE b.option_id = aso.option_id
               AND b.status != 'cancelled'
               AND b.payment_status != 'failed'),
              0
            )
          )
        END as max_quantity,
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
      ORDER BY aso.price ASC
    `, [activityId, activityId]);

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