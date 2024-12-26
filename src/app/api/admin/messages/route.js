import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

export async function GET(req) {
  let connection;
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: '權限不足' }, { status: 403 });
    }

    connection = await mysql.createConnection(dbConfig);

    // 獲取所有聊天室及其最新訊息
    const [chatRooms] = await connection.execute(`
      SELECT 
        cr.*,
        u.name as user_name,
        u.email as user_email,
        a.name as admin_name
      FROM chat_rooms cr
      JOIN users u ON cr.user_id = u.id
      LEFT JOIN admins a ON cr.admin_id = a.id
      ORDER BY cr.last_message_time DESC
    `);

    return NextResponse.json({ messages: chatRooms });

  } catch (error) {
    console.error('獲取聊天室失敗:', error);
    return NextResponse.json({ 
      error: '獲取聊天室失敗', 
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    }, { status: 500 });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
} 