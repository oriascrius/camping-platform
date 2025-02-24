import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    
    // 從活動營位選項表獲取所有營位資訊，包含可容納人數
    const [activityOptions] = await db.execute(
      `SELECT aso.option_id, aso.max_quantity, aso.spot_id, 
              csa.capacity, csa.name as spot_name
       FROM activity_spot_options aso
       LEFT JOIN camp_spot_applications csa 
         ON aso.spot_id = csa.spot_id 
         AND aso.application_id = csa.application_id
       WHERE aso.activity_id = ?`,
      [id]
    );

    // 獲取已預訂數量
    const [bookings] = await db.execute(`
      SELECT 
        b.option_id, 
        SUM(b.quantity) as total_booked
      FROM bookings b
      WHERE b.option_id IN (
        SELECT option_id 
        FROM activity_spot_options 
        WHERE activity_id = ?
      )
      AND b.status = 'confirmed'      /* 已確認的訂單 */
      AND b.payment_status = 'paid'   /* 已付款的訂單 */
      GROUP BY b.option_id`,
      [id]
    );

    // 整合數據
    const formattedStats = {
      spots: activityOptions.reduce((acc, option) => {
        const bookingData = bookings.find(b => b.option_id === option.option_id);
        const bookedQuantity = parseInt(bookingData?.total_booked || 0);
        const totalQuantity = parseInt(option.max_quantity || 0);

        acc[option.option_id] = {
          name: option.spot_name,
          max_people: option.capacity,      // 每個營位可住幾人
          total: totalQuantity,             // 總數量（來自 max_quantity）
          booked: bookedQuantity,           // 已預訂數量
          available: Math.max(0, totalQuantity - bookedQuantity)  // 剩餘數量
        };
        return acc;
      }, {})
    };

    return NextResponse.json(formattedStats);
  } catch (error) {
    console.error("獲取預訂統計數據錯誤:", error);
    return NextResponse.json(
      { error: "獲取預訂統計數據失敗" },
      { status: 500 }
    );
  }
}
