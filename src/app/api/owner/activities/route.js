import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET: 獲取營主的活動列表
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '未授權訪問' },
        { status: 401 }
      );
    }

    const ownerId = session.user.id;

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



    const [activities] = await pool.query(query, [ownerId]);

    return NextResponse.json({ 
      activities,
      message: '成功獲取活動列表'
    });

  } catch (error) {
    console.error('獲取活動列表錯誤:', error);
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
    if (!session?.user?.id) {
      return NextResponse.json({ error: '請先登入' }, { status: 401 });
    }

    const data = await request.json();
    
    const connection = await pool.getConnection();
    await connection.beginTransaction();

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
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('新增活動失敗:', error);
    return NextResponse.json({ 
      error: '新增活動失敗',
      details: error.message 
    }, { status: 500 });
  }
} 