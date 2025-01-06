import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import db from '@/lib/db';

export async function GET(request) {
  try {
    // 驗證營主身份
    const session = await getServerSession(authOptions);
    if (!session?.user?.isOwner) {
      return NextResponse.json({ error: '未授權的訪問' }, { status: 401 });
    }

    // 取得查詢參數
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const payment = searchParams.get('payment') || 'all';

    // 修改查詢，移除不存在的資料表關聯
    let sql = `
      SELECT 
        b.*,
        aso.option_id,
        aso.activity_id,
        aso.spot_id,
        csa.name AS spot_name,
        sa.activity_name,
        sa.title AS activity_title,
        bd.check_in_date,
        bd.check_out_date
      FROM bookings b
      LEFT JOIN activity_spot_options aso ON b.option_id = aso.option_id
      LEFT JOIN camp_spot_applications csa ON aso.spot_id = csa.spot_id
      LEFT JOIN spot_activities sa ON aso.activity_id = sa.activity_id
      LEFT JOIN booking_dates bd ON b.booking_id = bd.booking_id
      WHERE 1=1
    `;

    const queryParams = [];

    // 加入搜尋條件
    if (search) {
      sql += ` AND (b.order_id LIKE ? OR b.contact_name LIKE ? OR b.contact_phone LIKE ?)`;
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // 加入狀態篩選
    if (status !== 'all') {
      sql += ` AND b.status = ?`;
      queryParams.push(status);
    }

    // 加入付款狀態篩選
    if (payment !== 'all') {
      sql += ` AND b.payment_status = ?`;
      queryParams.push(payment);
    }

    // 加入排序
    sql += ` ORDER BY b.created_at DESC`;

    console.log('SQL查詢:', sql); // 檢查 SQL

    // 執行查詢
    const [rows] = await db.query(sql, queryParams);

    // 確保返回的是陣列
    const bookings = Array.isArray(rows) ? rows : [];
    
    return NextResponse.json({ 
      success: true,
      data: bookings 
    });

  } catch (error) {
    console.error('獲取訂單列表失敗:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '獲取訂單列表失敗',
        message: error.message 
      },
      { status: 500 }
    );
  }
} 