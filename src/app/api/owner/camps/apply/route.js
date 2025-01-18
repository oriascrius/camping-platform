import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import db from '@/lib/db';

// POST: 提交營地申請
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isOwner) {
      return NextResponse.json({ error: '未授權訪問' }, { status: 401 });
    }

    const data = await request.json();
    const ownerId = session.user.id;

    // 開始資料庫交易
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // 插入營地申請資料
      const [result] = await connection.query(
        `INSERT INTO camp_applications (
          owner_id,
          owner_name,
          name,
          address,
          description,
          rules,
          notice,
          status,
          operation_status,
          image_url,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, NOW())`,
        [
          ownerId,
          data.owner_name,
          data.name,
          data.address,
          data.description,
          data.rules || null,
          data.notice || null,
          data.operation_status || 1,
          data.image_url || 'default.jpg'
        ]
      );

      const applicationId = result.insertId;

      // 處理營位資料
      if (data.spots && data.spots.length > 0) {
        for (const spot of data.spots) {
          // 插入營位資料
          const [spotResult] = await connection.query(
            `INSERT INTO camp_spot_applications (
              application_id,
              owner_name,
              name,
              capacity,
              price,
              description,
              status,
              created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
              applicationId,
              data.owner_name,
              spot.name,
              spot.capacity,
              spot.price,
              spot.description || null,
              spot.status || 1
            ]
          );

          const spotId = spotResult.insertId;

          // 處理營位圖片
          if (spot.images && spot.images.length > 0) {
            for (let i = 0; i < spot.images.length; i++) {
              await connection.query(
                `INSERT INTO camp_spot_images (
                  owner_id,
                  spot_id,
                  image_path,
                  image_type,
                  sort_order,
                  created_at
                ) VALUES (?, ?, ?, ?, ?, NOW())`,
                [
                  ownerId,
                  spotId,
                  spot.images[i],
                  0,  // 一般圖片
                  i   // 排序順序
                ]
              );
            }
          }
        }
      }

      await connection.commit();
      return NextResponse.json({
        success: true,
        message: '營地申請已提交',
        applicationId: applicationId
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('提交營地申請失敗:', error);
    return NextResponse.json(
      { error: '提交申請失敗', details: error.message },
      { status: 500 }
    );
  }
}

// GET: 獲取營地申請列表
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isOwner) {
      return NextResponse.json({ error: '未授權訪問' }, { status: 401 });
    }

    const [applications] = await db.query(
      `SELECT 
        ca.*,
        GROUP_CONCAT(ci.image_url) as images
       FROM camp_applications ca
       LEFT JOIN camp_images ci ON ca.application_id = ci.application_id
       WHERE ca.owner_id = ?
       GROUP BY ca.application_id
       ORDER BY ca.created_at DESC`,
      [session.user.id]
    );

    // 處理圖片數組
    const processedApplications = applications.map(app => ({
      ...app,
      images: app.images ? app.images.split(',') : [],
      facilities: JSON.parse(app.facilities || '[]'),
      rules: JSON.parse(app.rules || '[]')
    }));

    return NextResponse.json({ applications: processedApplications });

  } catch (error) {
    console.error('獲取營地申請列表失敗:', error);
    return NextResponse.json(
      { error: '獲取申請列表失敗' },
      { status: 500 }
    );
  }
} 