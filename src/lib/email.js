import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendEmail({ to, subject, html }) {
  try {
    const info = await transporter.sendMail({
      from: `"您的網站名稱" <${process.env.SMTP_FROM}>`,
      to,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
            <h1 style="color: #28a745;">${subject}</h1>
          </div>
          <div style="padding: 20px;">
            ${html}
          </div>
          <div style="text-align: center; padding: 20px; color: #6c757d; font-size: 12px;">
            此郵件由系統自動發送，請勿直接回覆
          </div>
        </div>
      `
    });

    console.log('郵件發送成功:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('郵件發送失敗:', error);
    throw new Error(`郵件發送失敗: ${error.message}`);
  }
} 