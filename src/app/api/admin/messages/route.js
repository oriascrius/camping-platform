import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import mysql from 'mysql2/promise';

// 這個檔案處理 /api/admin/messages 的請求
export async function GET(req) {
  let connection;
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: '權限不足' }, { status: 403 });
    }

    const config = {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: 3306
    };

    connection = await mysql.createConnection(config);

    // 獲取所有聊天室列表
    const [chatRooms] = await connection.execute(`
      SELECT 
        cr.*,
        u.name as user_name,
        a.name as admin_name,
        (
          SELECT COUNT(*) 
          FROM chat_messages cm 
          WHERE cm.room_id = cr.id 
          AND cm.status = 'sent'
        ) as unread_count
      FROM chat_rooms cr
      LEFT JOIN users u ON cr.user_id = u.id
      LEFT JOIN admins a ON cr.admin_id = a.id
      WHERE cr.status = 'active'
      ORDER BY cr.last_message_time DESC
    `);

    return NextResponse.json({ chatRooms });

  } catch (error) {
    console.error('操作失敗:', error);
    return NextResponse.json({ 
      error: '操作失敗', 
      details: error.message 
    }, { status: 500 });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
} 