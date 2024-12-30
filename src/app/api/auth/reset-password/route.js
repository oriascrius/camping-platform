import db from '@/lib/db';
import crypto from 'crypto';  // Node.js 內建的 crypto 模組

export async function POST(request) {
  try {
    const { email, otp, newPassword } = await request.json();

    // 驗證 OTP
    const [resetRecord] = await db.execute(
      `SELECT pr.*, u.id as user_id 
       FROM password_resets pr
       JOIN users u ON pr.user_id = u.id
       WHERE u.email = ? 
       AND pr.otp = ?
       AND pr.used = 0
       AND pr.expires_at > NOW()
       ORDER BY pr.created_at DESC
       LIMIT 1`,
      [email, otp]
    );

    if (!resetRecord.length) {
      return Response.json(
        { error: '無效的請求' },
        { status: 400 }
      );
    }

    // 使用 MD5 加密新密碼
    const hashedPassword = crypto
      .createHash('md5')
      .update(newPassword)
      .digest('hex');

    // 更新密碼
    await db.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, resetRecord[0].user_id]
    );

    // 標記 OTP 為已使用
    await db.execute(
      'UPDATE password_resets SET used = 1 WHERE id = ?',
      [resetRecord[0].id]
    );

    return Response.json({ success: true });
  } catch (error) {
    console.error('重設密碼錯誤:', error);
    return Response.json(
      { error: '重設密碼過程發生錯誤' },
      { status: 500 }
    );
  }
} 