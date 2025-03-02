import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import pool from '@/lib/db';  // 引入資料庫連接池

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授權訪問' }, { status: 401 });
    }

    const [camps] = await db.query(`
      SELECT 
        ca.application_id,
        ca.name as camp_name,
        ca.address,
        ca.status as application_status,
        ca.image_url as camp_image,
        ca.operation_status as camp_status,
        csa.spot_id,
        csa.name,
        csa.capacity,
        csa.status,
        csa.description,
        csa.created_at,
        COALESCE(aso.max_quantity, 0) as max_quantity,
        COALESCE(aso.price, csa.price) as price
      FROM camp_applications ca
      LEFT JOIN camp_spot_applications csa 
        ON ca.application_id = csa.application_id
      LEFT JOIN activity_spot_options aso 
        ON csa.spot_id = aso.spot_id
      WHERE ca.owner_id = ?
      ORDER BY ca.application_id, csa.spot_id
    `, [session.user.id]);

    // 整理資料結構
    const groupedCamps = camps.reduce((acc, camp) => {
      if (!acc[camp.application_id]) {
        acc[camp.application_id] = {
          application_id: camp.application_id,
          camp_name: camp.camp_name,
          address: camp.address,
          camp_image: camp.camp_image,
          camp_status: camp.camp_status,
          spots: [],
          status: camp.application_status
        };
      }

      if (camp.spot_id) {
        // 生成真正唯一的 key
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        const unique_key = `${camp.application_id}-${camp.spot_id}-${timestamp}-${random}`;

        acc[camp.application_id].spots.push({
          spot_id: camp.spot_id,
          name: camp.name,
          capacity: camp.capacity,
          status: camp.status,
          description: camp.description,
          created_at: camp.created_at,
          max_quantity: parseInt(camp.max_quantity) || 0,
          price: parseInt(camp.price) || 0,
          unique_key: unique_key  // 使用新生成的唯一 key
        });
      }

      console.log('營地狀態:', camp.status);

      return acc;
    }, {});

    console.log('處理後的營位資料:', groupedCamps);

    return NextResponse.json({ 
      success: true, 
      camps: Object.values(groupedCamps)
    });

  } catch (error) {
    console.error('獲取營位列表失敗:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授權訪問' }, { status: 401 });
    }

    const data = await request.json();
    console.log('API 收到的原始資料:', data);  // 檢查收到的資料
    console.log('maxQuantity 值:', data.maxQuantity);  // 特別檢查 maxQuantity
    console.log('capacity 值:', data.capacity);  // 特別檢查 capacity
    
    // 確保 maxQuantity 有值
    const maxQuantity = parseInt(data.maxQuantity) || data.capacity;
    console.log('處理後的 maxQuantity:', maxQuantity);  // 檢查處理後的值
    
    const connection = await pool.getConnection();
    
    await connection.beginTransaction();
    try {
      // 1. 新增到 camp_spot_applications
      const [result] = await connection.query(`
        INSERT INTO camp_spot_applications (
          application_id, 
          name, 
          capacity,
          status,
          description,
          price,
          owner_name
        ) VALUES (?, ?, ?, 1, ?, ?, ?)
      `, [
        data.application_id,
        data.name,
        data.capacity,
        data.description || null,
        data.price,
        session.user.name
      ]);

      const newSpotId = result.insertId;
      console.log('新增的 spot_id:', newSpotId);  // 檢查新增的 ID

      // 2. 查詢該營地的所有活動，如果沒有活動就創建一個預設活動
      const [activities] = await connection.query(`
        SELECT activity_id 
        FROM spot_activities 
        WHERE application_id = ?
      `, [data.application_id]);

      // 如果沒有找到活動，先創建一個預設活動
      if (activities.length === 0) {
        console.log('沒有找到活動，創建預設活動');
        const [activityResult] = await connection.query(`
          INSERT INTO spot_activities (
            application_id,
            activity_name
          ) VALUES (?, ?)
        `, [
          data.application_id,
          '預設活動'  // 或使用營地名稱
        ]);
        
        activities.push({ activity_id: activityResult.insertId });
      }

      // 3. 為每個活動新增營位選項
      for (const activity of activities) {
        console.log('正在處理活動:', activity.activity_id);
        console.log('準備寫入的 max_quantity:', maxQuantity);
        
        // 先查詢最大的 sort_order
        const [sortResult] = await connection.query(`
          SELECT COALESCE(MAX(sort_order), 0) + 1 as next_sort
          FROM activity_spot_options 
          WHERE activity_id = ?
        `, [activity.activity_id]);
        
        const nextSortOrder = sortResult[0].next_sort;

        // 然後執行插入
        await connection.query(`
          INSERT INTO activity_spot_options (
            activity_id,
            spot_id,
            application_id,
            price,
            max_quantity,
            sort_order
          ) VALUES (?, ?, ?, ?, ?, ?)
        `, [
          activity.activity_id,
          newSpotId,
          data.application_id,
          data.price,
          maxQuantity,
          nextSortOrder
        ]);
      }

      await connection.commit();
      console.log('交易完成，所有資料寫入成功');
      return NextResponse.json({ 
        success: true,
        spot_id: newSpotId
      });
      
    } catch (error) {
      console.error('交易過程發生錯誤:', error);
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('新增營位失敗:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
} 