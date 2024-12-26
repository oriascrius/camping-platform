import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';

// 處理 GET 請求
export async function GET(request, { params }) {
  let connection;
  try {
    const { roomId } = await params;

    const config = {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: 3306
    };

    connection = await mysql.createConnection(config);
    
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
  } catch (error) {
    console.error('獲取訊息錯誤:', error);
    return NextResponse.json({ 
      error: '獲取訊息失敗',
      details: error.message 
    }, { status: 500 });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 處理 POST 請求
export async function POST(request, { params }) {
  let connection;
  try {
    const { roomId } = params;
    const body = await request.json();
    const messageId = uuidv4();

    console.log('收到的請求資料:', { 
      roomId, 
      body,
      senderType: body.senderType,
      userId: body.userId
    });

    const config = {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: 3306
    };

    connection = await mysql.createConnection(config);

    // 首先驗證用戶身分
    if (body.senderType === 'admin') {
      // 檢查是否為管理員
      const [adminCheck] = await connection.execute(
        'SELECT id FROM admins WHERE id = ?',
        [body.userId]
      );
      
      if (adminCheck.length === 0) {
        throw new Error('無效的管理員身分');
      }
    }

    // 檢查重複訊息
    const [existingMessages] = await connection.execute(`
      SELECT id FROM chat_messages 
      WHERE room_id = ? 
      AND user_id = ? 
      AND message = ?
      AND sender_type = ?
      AND created_at > DATE_SUB(NOW(), INTERVAL 5 SECOND)
    `, [roomId, body.userId, body.message, body.senderType]);

    if (existingMessages.length > 0) {
      console.log('發現重複訊息:', existingMessages);
      return NextResponse.json({ 
        error: '訊息重複發送',
        messageId: existingMessages[0].id
      }, { status: 409 });
    }
    
    // 插入訊息時確保 sender_type 正確
    const [result] = await connection.execute(`
      INSERT INTO chat_messages 
      (id, room_id, user_id, message, sender_type, message_type, status, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      messageId,
      roomId,
      body.userId,
      body.message,
      body.senderType,  // 使用傳入的 senderType
      'text',
      'sent'
    ]);

    // 更新聊天室最後訊息
    await connection.execute(`
      UPDATE chat_rooms 
      SET last_message_time = NOW(),
          last_message = ?,
          last_sender_type = ?  -- 添加發送者類型
      WHERE id = ?
    `, [body.message, body.senderType, roomId]);

    console.log('訊息發送成功:', { 
      messageId,
      senderType: body.senderType,
      userId: body.userId 
    });

    return NextResponse.json({ 
      success: true,
      messageId: messageId,
      senderType: body.senderType  // 返回發送者類型以供確認
    });

  } catch (error) {
    console.error('發送訊息錯誤:', error);
    return NextResponse.json({ 
      error: '發送訊息失敗',
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 允許 OPTIONS 請求
export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Origin': '*',
    },
  });
} 