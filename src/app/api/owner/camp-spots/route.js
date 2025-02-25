import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const owner_id = session.user.id;

    // 獲取營位資料，包含圖片
    const spots = await db.query(`
      SELECT 
        csa.*,
        GROUP_CONCAT(
          JSON_OBJECT(
            'image_id', csi.image_id,
            'image_path', csi.image_path,
            'image_type', csi.image_type,
            'sort_order', csi.sort_order
          )
        ) as images
      FROM camp_spot_applications csa
      LEFT JOIN camp_spot_images csi ON csa.spot_id = csi.spot_id
      WHERE csa.application_id IN (
        SELECT application_id 
        FROM camp_applications 
        WHERE owner_id = ?
      )
      GROUP BY csa.spot_id
      ORDER BY csa.created_at DESC
    `, [owner_id]);

    // 處理圖片資料
    const spotsWithImages = spots.map(spot => ({
      ...spot,
      images: spot.images 
        ? JSON.parse(`[${spot.images}]`.replace(/\\/g, ''))
        : []
    }));

    return NextResponse.json({
      success: true,
      spots: spotsWithImages
    });

  } catch (error) {
    console.error('Error fetching camp spots:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch camp spots' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const owner_id = session.user.id;
    const data = await request.json();

    // 新增營位資料
    const result = await db.query(`
      INSERT INTO camp_spot_applications 
      (application_id, owner_name, name, capacity, price, description, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      data.application_id,
      data.owner_name,
      data.name,
      data.capacity,
      data.price,
      data.description,
      data.status || 0
    ]);

    if (data.images && data.images.length > 0) {
      // 新增圖片資料
      const imageValues = data.images.map((image, index) => [
        owner_id,
        result.insertId,
        image.image_path,
        image.image_type || 0,
        index
      ]);

      await db.query(`
        INSERT INTO camp_spot_images 
        (owner_id, spot_id, image_path, image_type, sort_order)
        VALUES ?
      `, [imageValues]);
    }

    return NextResponse.json({
      success: true,
      message: 'Camp spot created successfully',
      spot_id: result.insertId
    });

  } catch (error) {
    console.error('Error creating camp spot:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create camp spot' },
      { status: 500 }
    );
  }
} 