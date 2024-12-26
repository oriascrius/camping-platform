import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

export async function GET(req, { params }) {
  let connection;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: '權限不足' }, { status: 403 });
    }

    const roomId = await params.roomId;
    
    connection = await mysql.createConnection(dbConfig);
    
    const [messages] = await connection.execute(`
      SELECT 
        cm.*,
        CASE 
          WHEN cm.sender_type = 'admin' THEN a.name
          ELSE u.name
        END as sender_name
      FROM chat_messages cm
      LEFT JOIN admins a ON cm.user_id = a.id AND cm.sender_type = 'admin'
      LEFT JOIN users u ON cm.user_id = u.id AND cm.sender_type = 'member'
      WHERE cm.room_id = ?
      ORDER BY cm.created_at ASC
    `, [roomId]);

    return NextResponse.json({ messages });

  } catch (error) {
    console.error('獲取訊息失敗:', error);
    return NextResponse.json({ 
      error: '獲取訊息失敗', 
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    }, { status: 500 });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

export async function POST(req, { params }) {
  let connection;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: '權限不足' }, { status: 403 });
    }

    const { roomId } = params;
    const { message } = await req.json();

    connection = await mysql.createConnection(dbConfig);
    
    const [result] = await connection.execute(`
      INSERT INTO chat_messages (
        id, room_id, user_id, sender_type, message, message_type, status
      ) VALUES (
        UUID(), ?, ?, 'admin', ?, 'text', 'sent'
      )
    `, [roomId, session.user.id, message]);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('發送訊息失敗:', error);
    return NextResponse.json({ 
      error: '發送訊息失敗', 
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    }, { status: 500 });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
} 