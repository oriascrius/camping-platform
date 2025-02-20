import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET: 獲取營主的活動列表
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    console.log('Session 資訊:', {
      hasSession: !!session,
      userId: session?.user?.id,
      email: session?.user?.email
    });

    if (!session?.user?.id) {
      console.log('未授權訪問: 無效的 session');
      return NextResponse.json(
        { error: '未授權訪問' },
        { status: 401 }
      );
    }

    const ownerId = session.user.id;
    console.log('查詢營主ID:', ownerId);

    let query = `
      SELECT 
        sa.*,
        MIN(aso.price) as min_price,
        MAX(aso.price) as max_price,
        SUM(aso.max_quantity) as total_spots,
        ca.address as camp_address,
        ca.name as camp_name,
        ca.image_url as camp_image,
        ca.operation_status
      FROM spot_activities sa
      LEFT JOIN camp_applications ca ON sa.application_id = ca.application_id
      LEFT JOIN activity_spot_options aso ON sa.activity_id = aso.activity_id
      WHERE sa.owner_id = ?
      GROUP BY sa.activity_id
      ORDER BY sa.start_date ASC
    `;

    console.log('執行 SQL 查詢:', query);
    console.log('查詢參數:', [ownerId]);

    const [activities] = await pool.query(query, [ownerId]);
    console.log('查詢結果數量:', activities.length);
    console.log('第一筆活動資料:', activities[0] || '無資料');

    return NextResponse.json({ 
      activities,
      message: '成功獲取活動列表'
    });

  } catch (error) {
    console.error('獲取活動列表錯誤:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json(
      { 
        error: '獲取活動列表失敗',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// POST: 新增活動
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    console.log('新增活動 - Session 資訊:', {
      hasSession: !!session,
      userId: session?.user?.id
    });

    if (!session?.user?.id) {
      console.log('新增活動 - 未授權訪問');
      return NextResponse.json({ error: '請先登入' }, { status: 401 });
    }

    const data = await request.json();
    console.log('新增活動 - 請求資料:', {
      applicationId: data.application_id,
      activityName: data.activity_name,
      optionsCount: data.options?.length || 0
    });
    
    const connection = await pool.getConnection();
    console.log('資料庫連線已建立');
    await connection.beginTransaction();
    console.log('交易已開始');

    try {
      // 新增活動基本資料
      const [result] = await connection.query(`
        INSERT INTO spot_activities (
          owner_id,
          application_id,
          activity_name,
          title,
          subtitle,
          main_image,
          description,
          notice,
          start_date,
          end_date,
          is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        session.user.id,
        data.application_id,
        data.activity_name,
        data.title,
        data.subtitle,
        data.main_image,
        data.description,
        data.notice,
        data.start_date,
        data.end_date,
        1
      ]);

      // 新增活動選項
      if (data.options?.length > 0) {
        const optionsValues = data.options.map(option => [
          result.insertId,
          option.spot_id,
          data.application_id,
          option.price,
          option.max_quantity,
          option.sort_order || 0
        ]);

        await connection.query(`
          INSERT INTO activity_spot_options (
            activity_id,
            spot_id,
            application_id,
            price,
            max_quantity,
            sort_order
          ) VALUES ?
        `, [optionsValues]);
      }

      await connection.commit();
      return NextResponse.json({ 
        message: '活動新增成功',
        activity_id: result.insertId 
      });
    } catch (error) {
      console.error('新增活動交易錯誤:', {
        message: error.message,
        stack: error.stack
      });
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
      console.log('資料庫連線已釋放');
    }
  } catch (error) {
    console.error('新增活動失敗:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json({ 
      error: '新增活動失敗',
      details: error.message 
    }, { status: 500 });
  }
} 