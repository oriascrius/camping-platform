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

    // 從 URL 獲取聊天室 ID
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const roomId = pathParts[pathParts.length - 1];

    // 如果有指定聊天室 ID，獲取特定聊天室的訊息
    if (roomId && roomId !== 'messages') {
      const [messages] = await connection.execute(`
        SELECT 
          cm.*,
          CASE 
            WHEN cm.sender_type = 'member' THEN u.name
            WHEN cm.sender_type = 'admin' THEN a.name
          END as sender_name
        FROM chat_messages cm
        LEFT JOIN users u ON cm.user_id = u.id AND cm.sender_type = 'member'
        LEFT JOIN admins a ON cm.user_id = a.id AND cm.sender_type = 'admin'
        WHERE cm.room_id = ?
        ORDER BY cm.created_at ASC
      `, [roomId]);

      return NextResponse.json({ messages });
    } else {
      // MySQL 原生語法
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

      // 檢查是否有聊天室
      if (!chatRooms.length) {
        // 如果沒有聊天室，創建一個測試聊天室
        await connection.execute(`
          INSERT INTO chat_rooms (
            id,
            user_id,
            admin_id,
            status,
            name,
            last_message,
            last_message_time
          ) VALUES (
            UUID(),
            1,
            1,
            'active',
            '測試聊天室',
            '歡迎使用客服系統',
            CURRENT_TIMESTAMP
          )
        `);

        // 重新獲取聊天室列表
        const [newChatRooms] = await connection.execute(`
          SELECT 
            cr.*,
            u.name as user_name,
            a.name as admin_name,
            0 as unread_count
          FROM chat_rooms cr
          LEFT JOIN users u ON cr.user_id = u.id
          LEFT JOIN admins a ON cr.admin_id = a.id
          WHERE cr.status = 'active'
          ORDER BY cr.last_message_time DESC
        `);

        return NextResponse.json({ chatRooms: newChatRooms });
      }

      return NextResponse.json({ chatRooms });
    }

  } catch (error) {
    console.error('操作失敗:', error);
    return NextResponse.json({ 
      error: '操作失敗', 
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    }, { status: 500 });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 新增 POST 方法處理發送訊息
export async function POST(req) {
  let connection;
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: '權限不足' }, { status: 403 });
    }

    const { roomId, message } = await req.json();
    
    connection = await mysql.createConnection(dbConfig);

    // 插入新訊息
    await connection.execute(`
      INSERT INTO chat_messages (
        id, 
        room_id, 
        user_id,
        sender_type,
        message,
        message_type,
        status
      ) VALUES (
        UUID(),
        ?,
        ?,
        'admin',
        ?,
        'text',
        'sent'
      )
    `, [roomId, session.user.id, message]);

    // 更新聊天室最後訊息
    await connection.execute(`
      UPDATE chat_rooms 
      SET 
        last_message = ?,
        last_message_time = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [message, roomId]);

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