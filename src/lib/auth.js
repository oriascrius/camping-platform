// (目前沒用到)
// JWT（JSON Web Token）相關功能
// 想像 JWT 就像是一個防偽的通行證，包含了持有人的身份信息
// 就像在主題樂園入場時，工作人員會給你一個特殊的手環，這個手環證明你已經付費可以入場
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

// 產生 JWT Token
// 就像是主題樂園的工作人員在為遊客製作特殊的入場手環
// 參數 user: 使用者資料物件，包含 id 和 email（就像是遊客的個人資料）
// 回傳: JWT token 字串（等同於已製作完成的手環）
export const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id,      // 使用者 ID（就像是遊客的身份證號碼）
      email: user.email // 使用者 Email（就像是遊客的聯絡方式）
    },
    process.env.JWT_SECRET,  // 使用環境變數中的密鑰（就像是製作手環的特殊工具）
    { expiresIn: '7d' }     // Token 有效期為 7 天（就像手環只能用 7 天）
  );
};

// 驗證 JWT Token
// 就像是園區內的工作人員檢查遊客手環的真偽
// 參數 token: JWT token 字串（就像是遊客出示的手環）
// 回傳: 解密後的使用者資料，若驗證失敗則回傳 null（就像確認手環是真的還是假的）
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;  // Token 無效或過期時回傳 null（就像發現手環是假的或已過期）
  }
};

// 取得當前登入的使用者資料
// 就像是檢查遊客是否戴著有效的手環並確認他的身份
// 回傳: 使用者資料物件，若未登入則回傳 null
export const getAuthUser = async () => {
  const cookieStore = await cookies();        // 取得 Cookie 存儲器（就像是檢查遊客的手腕）
  const token = cookieStore.get('token');     // 從 Cookie 中取得 token（就像是查看手環）
  
  if (!token) return null;                    // 若無 token 則回傳 null（沒戴手環的遊客）
  
  const decoded = verifyToken(token.value);   // 驗證 token（檢查手環的真偽）
  if (!decoded) return null;                  // 若驗證失敗則回傳 null（手環是假的或過期）
  
  return decoded;                             // 回傳解密後的使用者資料（確認是合法遊客）
};