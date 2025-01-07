// JWT 相關功能
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

// 產生 JWT Token
// 參數 user: 使用者資料物件，包含 id 和 email
// 回傳: JWT token 字串
export const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id,      // 使用者 ID
      email: user.email // 使用者 Email
    },
    process.env.JWT_SECRET,  // 使用環境變數中的密鑰
    { expiresIn: '7d' }     // Token 有效期為 7 天
  );
};

// 驗證 JWT Token
// 參數 token: JWT token 字串
// 回傳: 解密後的使用者資料，若驗證失敗則回傳 null
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;  // Token 無效或過期時回傳 null
  }
};

// 取得當前登入的使用者資料
// 回傳: 使用者資料物件，若未登入則回傳 null
export const getAuthUser = async () => {
  const cookieStore = await cookies();        // 取得 Cookie 存儲器
  const token = cookieStore.get('token');     // 從 Cookie 中取得 token
  
  if (!token) return null;                    // 若無 token 則回傳 null
  
  const decoded = verifyToken(token.value);   // 驗證 token
  if (!decoded) return null;                  // 若驗證失敗則回傳 null
  
  return decoded;                             // 回傳解密後的使用者資料
};