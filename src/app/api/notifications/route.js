import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import pool from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';


// 一般用戶日常使用（查看通知、標記已讀）
// 1. GET：獲取當前用戶的通知列表
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: '未授權' }, { status: 401 });
    }

    const userId = session.user.id;
    const [notifications] = await pool.execute(
      `SELECT * FROM notifications 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [userId]
    );

    return NextResponse.json(notifications);
  } catch (error) {
    console.error('獲取通知失敗:', error);
    return NextResponse.json({ error: '獲取通知失敗' }, { status: 500 });
  }
}

// 2. POST：發送通知
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: '未授權' }, { status: 401 });
    }

    const data = await req.json();
    const { targetRole, type, title, content } = data;

    // 如果是群發通知
    if (targetRole) {
      let targetUsers = [];
      
      // 獲取目標用戶
      if (targetRole === 'user' || targetRole === 'all') {
        const [users] = await pool.execute(
          'SELECT id FROM users WHERE status = 1'
        );
        targetUsers = [...targetUsers, ...users];
      }
      
      if (targetRole === 'owner' || targetRole === 'all') {
        const [owners] = await pool.execute(
          'SELECT id FROM owners WHERE status = 1'
        );
        targetUsers = [...targetUsers, ...owners];
      }

      // 批量插入通知
      for (const user of targetUsers) {
        await pool.execute(
          `INSERT INTO notifications 
           (id, user_id, type, title, content, is_read, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [uuidv4(), user.id, type, title, content, 0, new Date()]
        );

        // WebSocket 通知
        if (global.io) {
          global.io.to(`notification_${user.id}`).emit('newNotification', {
            type, title, content, created_at: new Date()
          });
        }
      }

      return NextResponse.json({ 
        success: true, 
        count: targetUsers.length 
      });
    }
    
    // 如果是單發通知
    const { userId } = data;
    const [result] = await pool.execute(
      `INSERT INTO notifications (id, user_id, type, title, content) 
       VALUES (?, ?, ?, ?, ?)`,
      [uuidv4(), userId, type, title, content]
    );

    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error('發送通知失敗:', error);
    return NextResponse.json({ error: '發送通知失敗' }, { status: 500 });
  }
}

// 3. PUT：標記通知為已讀
export async function PUT(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '未授權' }, { status: 401 });
    }

    // 執行更新
    const [result] = await pool.execute(
      `UPDATE notifications 
       SET is_read = 1, 
           updated_at = NOW() 
       WHERE user_id = ? 
       AND is_read = 0`,
      [session.user.id]
    );

    // 檢查更新結果
    if (result.affectedRows > 0) {
      return NextResponse.json({ 
        success: true,
        message: '所有通知已標記為已讀',
        updatedCount: result.affectedRows 
      });
    } else {
      return NextResponse.json({ 
        success: true,
        message: '沒有需要更新的通知' 
      });
    }

  } catch (error) {
    console.error('標記通知已讀失敗:', error);
    return NextResponse.json(
      { error: '標記已讀失敗', details: error.message },
      { status: 500 }
    );
  }
} 