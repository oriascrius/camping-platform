import db from '@/lib/db';

export async function PUT(request, { params }) {
  try {
    const { roomId } = params;

    await db.execute(
      `UPDATE chat_rooms 
       SET unread_count = 0
       WHERE id = ?`,
      [roomId]
    );

    return Response.json({ success: true });
  } catch (error) {
    console.error('更新未讀數失敗:', error);
    return Response.json(
      { error: '更新未讀數失敗' },
      { status: 500 }
    );
  }
}