import db from '@/lib/db';
import { generateOTP } from '@/lib/utils';
import { sendEmail } from '@/lib/email';

export async function POST(request) {
  try {
    const { email } = await request.json();

    // 檢查信箱是否存在
    const [users] = await db.execute(
      'SELECT id, email FROM users WHERE email = ?',
      [email]
    );

    if (!users.length) {
      return Response.json(
        { error: '此信箱尚未註冊' },
        { status: 404 }
      );
    }

    const user = users[0];
    const otp = generateOTP();
    const expiryTime = new Date(Date.now() + 10 * 60 * 1000); // 10分鐘後過期

    // 儲存 OTP
    await db.execute(
      `INSERT INTO password_resets (user_id, otp, expires_at) 
       VALUES (?, ?, ?)`,
      [user.id, otp, expiryTime]
    );

    // 發送郵件
    await sendEmail({
      to: email,
      subject: '重設密碼驗證碼',
      html: `
        <p>您的驗證碼是: ${otp}</p>
        <p>此驗證碼將在 10 分鐘後失效</p>
      `
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('發送OTP錯誤:', error);
    return Response.json(
      { error: '發送驗證碼失敗' },
      { status: 500 }
    );
  }
} 