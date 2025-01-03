import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function GET(request) {
  try {
    // 驗證session
    const session = await getServerSession(authOptions);
    if (!session?.user?.isOwner) {
      return NextResponse.json({ error: '未授權的訪問' }, { status: 401 });
    }

    // 使用靜態資料
    const mockStats = {
      success: true,
      stats: {
        totalBookings: 25,      // 模擬訂單數
        totalCamps: 3,          // 模擬營地數
        totalRevenue: 75000,    // 模擬收入
        averageRating: 4.5      // 模擬評分
      }
    };

    return NextResponse.json(mockStats);

  } catch (error) {
    console.error('獲取統計資料錯誤:', error);
    return NextResponse.json(
      { success: false, error: '獲取統計資料失敗' },
      { status: 500 }
    );
  }
} 