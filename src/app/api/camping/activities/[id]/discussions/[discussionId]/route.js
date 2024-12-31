import db from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// PUT: 更新評論
export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: '請先登入' }, { status: 401 });
    }

    const { discussionId } = params;
    const { content, rating } = await req.json();

    // 驗證評論內容
    if (!content?.trim()) {
      return Response.json({ error: '請輸入評論內容' }, { status: 400 });
    }

    // 驗證評分
    if (!rating || rating < 1 || rating > 5) {
      return Response.json({ error: '請給予有效評分(1-5)' }, { status: 400 });
    }

    // 檢查是否是評論作者
    const [discussion] = await db.query(
      'SELECT user_id FROM user_discussions WHERE id = ?',
      [discussionId]
    );

    if (!discussion || discussion[0].user_id !== session.user.id) {
      return Response.json({ error: '無權限編輯此評論' }, { status: 403 });
    }

    // 更新評論
    await db.query(
      'UPDATE user_discussions SET content = ?, rating = ?, updated_at = NOW() WHERE id = ?',
      [content, rating, discussionId]
    );

    return Response.json({ message: '評論已更新' });
  } catch (error) {
    console.error('Error updating discussion:', error);
    return Response.json({ error: '更新評論失敗' }, { status: 500 });
  }
}

// DELETE: 刪除評論
export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: '請先登入' }, { status: 401 });
    }

    const { discussionId } = params;

    // 檢查是否是評論作者
    const [discussion] = await db.query(
      'SELECT user_id FROM user_discussions WHERE id = ?',
      [discussionId]
    );

    if (!discussion || discussion[0].user_id !== session.user.id) {
      return Response.json({ error: '無權限刪除此評論' }, { status: 403 });
    }

    // 軟刪除評論
    await db.query(
      'UPDATE user_discussions SET status = 0 WHERE id = ?',
      [discussionId]
    );

    return Response.json({ message: '評論已刪除' });
  } catch (error) {
    console.error('Error deleting discussion:', error);
    return Response.json({ error: '刪除評論失敗' }, { status: 500 });
  }
} 