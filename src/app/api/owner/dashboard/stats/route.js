import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: '未授權的請求' }, { status: 401 });
    }

    const ownerId = session.user.id;

    // 先只查詢活動數量
    const [activitiesResult] = await pool.query(`
      SELECT 
        COUNT(*) as total_activities,
        SUM(CASE 
          WHEN is_active = 1 AND end_date >= CURDATE() 
          THEN 1 ELSE 0 
        END) as active_activities
      FROM spot_activities 
      WHERE owner_id = ?
    `, [ownerId]);

    return NextResponse.json({
      totalActivities: activitiesResult[0].total_activities,
      activeActivities: activitiesResult[0].active_activities,
      totalBookings: 0,  // 先設為 0
      totalRevenue: 0,   // 先設為 0
      monthlyRevenue: 0, // 先設為 0
      pendingBookings: 0 // 先設為 0
    });

  } catch (error) {
    console.error('獲取儀表板數據失敗:', error);
    return NextResponse.json(
      { error: '獲取數據失敗' },
      { status: 500 }
    );
  }
} 