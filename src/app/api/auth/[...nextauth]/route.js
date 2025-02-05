// ===== 核心套件引入 =====
import NextAuth from 'next-auth';  // NextAuth 身份驗證框架：用於處理使用者認證和授權
import CredentialsProvider from 'next-auth/providers/credentials';  // 憑證驗證提供者：處理帳號密碼登入

// ===== 工具套件引入 =====
import bcrypt from 'bcryptjs';  // 密碼加密工具：用於密碼的雜湊加密與驗證

// ===== 資料庫連接引入 =====
import db from '@/lib/db';  // MySQL 資料庫連接：用於資料的存取與管理

export const authOptions = {
  // ===== 驗證提供者設定：定義如何處理登入請求 =====
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      // 定義登入表單欄位：指定需要的登入資訊
      credentials: {
        email: { label: "電子郵件", type: "email" },
        password: { label: "密碼", type: "password" }
      },

      // ===== 登入驗證邏輯：處理使用者登入驗證流程 =====
      async authorize(credentials) {
        try {
          // ===== 1. 管理員身份驗證流程 =====
          // 查詢管理員帳號：檢查信箱是否存在且帳號已啟用
          const [admins] = await db.execute(
            'SELECT * FROM admins WHERE email = ? AND status = 1',
            [credentials.email]
          );

          const admin = admins[0];
          if (admin) {
            // 驗證管理員密碼：比對輸入密碼與資料庫儲存的雜湊值
            const isValid = await bcrypt.compare(credentials.password, admin.password);
            
            if (isValid) {
              // 更新管理員登入資訊：記錄登入時間和 IP
              await db.execute(
                'UPDATE admins SET login_at = NOW(), login_ip = ? WHERE id = ?',
                [credentials.ip || null, admin.id]
              );

              // 回傳管理員資料：包含身份識別和權限資訊
              return {
                id: `admin_${admin.id}`,
                name: admin.name,
                email: admin.email,
                role: admin.role === 2 ? 'super_admin' : 'admin', // 角色判斷：2代表超級管理員
                isAdmin: true,
                isOwner: false,
                adminId: admin.id,
                adminRole: admin.role
              };
            }
          }

          // ===== 2. 營地主身份驗證流程 =====
          // 查詢營地主帳號：檢查信箱是否存在且帳號已啟用
          const [owners] = await db.execute(
            'SELECT * FROM owners WHERE email = ? AND status = 1',
            [credentials.email]
          );

          const owner = owners[0];
          if (owner) {
            // 驗證營地主密碼
            const isValid = await bcrypt.compare(credentials.password, owner.password);
            
            if (isValid) {
              // 回傳營地主資料結構
              return {
                id: `owner_${owner.id}`,
                name: owner.name,
                email: owner.email,
                role: 'owner',
                isAdmin: false,
                isOwner: true,
                ownerId: owner.id
              };
            }
          }

          // ===== 3. 一般會員身份驗證 =====
          // 查詢啟用狀態的會員帳號
          const [users] = await db.execute(
            'SELECT * FROM users WHERE email = ? AND status = 1',
            [credentials.email]
          );

          const user = users[0];
          if (user) {
            // 驗證會員密碼
            const isValid = await bcrypt.compare(credentials.password, user.password);
            
            if (isValid) {
              // 回傳會員資料結構
              return {
                id: user.id.toString(),
                name: user.name,
                email: user.email,
                role: 'user',
                isAdmin: false,
                isOwner: false,
                userId: user.id
              };
            }
          }

          // 驗證失敗回傳空值
          return null;
        } catch (error) {
          console.error('身份驗證發生錯誤:', error);
          return null;
        }
      }
    })
  ],

  // ===== 回調函數設定：定義身份驗證過程中的關鍵處理邏輯 =====
  callbacks: {
    // JWT 令牌處理：管理身份驗證令牌的生成和更新
    async jwt({ token, user }) {
      if (user) {
        // 將使用者資訊整合到令牌中：確保所有必要資訊都包含在令牌裡
        return {
          ...token,
          ...user,
          role: user.role,
          isAdmin: user.isAdmin,
          isOwner: user.isOwner,
          userId: user.userId,
          ownerId: user.ownerId,
          adminId: user.adminId,
          name: user.name,
          email: user.email,
          adminRole: user.adminRole
        };
      }
      return token;
    },

    // 工作階段處理：管理使用者登入狀態
    async session({ session, token }) {
      if (token) {
        // 將令牌資訊同步到工作階段：確保前端可以存取使用者資訊
        session.user = {
          ...session.user,
          id: token.isAdmin ? token.adminId : 
              token.isOwner ? token.ownerId : 
              token.userId,
          role: token.role,
          isAdmin: token.isAdmin,
          isOwner: token.isOwner,
          name: token.name,
          email: token.email,
          adminRole: token.adminRole,
          ownerId: token.ownerId
        };
      }
      return session;
    },

    // 登出處理：使用者登出時觸發
    async signOut({ token, session }) {
      try {
        // 可在此處理額外的登出邏輯
        // 例如：清除資料庫中的工作階段紀錄
        // 或清除其他相關的 cookies
        return true;
      } catch (error) {
        console.error('登出過程發生錯誤:', error);
        return false;
      }
    },
  },

  // ===== 系統配置設定 =====
  // 自定義頁面路徑：指定身份驗證相關的頁面位置
  pages: {
    signIn: '/auth/login',    // 登入頁面
    signOut: '/auth/logout',  // 登出頁面
    error: '/auth/error',     // 錯誤頁面
  },

  // 工作階段設定：定義使用者登入狀態的管理方式
  session: {
    strategy: 'jwt',          // 使用 JWT 策略
    maxAge: 30 * 24 * 60 * 60, // 有效期：30天
    updateAge: 24 * 60 * 60,   // 更新間隔：1天
  },

  // JWT 設定：定義令牌的加密和有效期
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,  // 加密密鑰
    maxAge: 30 * 24 * 60 * 60,           // 有效期：30天
  },

  // 開發環境設定：方便開發時除錯
  debug: process.env.NODE_ENV === 'development',
};

// ===== NextAuth 處理器設定 =====
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };  // 導出處理 HTTP 請求的方法
