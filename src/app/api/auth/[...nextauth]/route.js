import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import crypto from 'crypto';
import db from '@/lib/db';

export const authOptions = {
  // ===== 認證提供者配置 =====
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      // 定義登入表單欄位
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },

      // 登入驗證邏輯
      async authorize(credentials) {
        try {
          // ===== 1. 管理員登入驗證 =====
          // 查詢啟用狀態的管理員帳號
          const [admins] = await db.execute(
            'SELECT * FROM admins WHERE email = ? AND status = 1',
            [credentials.email]
          );

          const admin = admins[0];
          if (admin) {
            // 使用 MD5 加密密碼進行比對
            const hashedPassword = crypto
              .createHash('md5')
              .update(credentials.password)
              .digest('hex');
            
            if (hashedPassword === admin.password) {
              // 更新管理員最後登入時間和 IP
              await db.execute(
                'UPDATE admins SET login_at = NOW(), login_ip = ? WHERE id = ?',
                [credentials.ip || null, admin.id]
              );

              // 返回管理員資訊
              return {
                id: `admin_${admin.id}`,
                name: admin.name,
                email: admin.email,
                role: admin.role === 2 ? 'super_admin' : 'admin', // 角色判斷：2為超級管理員
                isAdmin: true,
                isOwner: false,
                adminId: admin.id,
                adminRole: admin.role
              };
            }
          }

          // ===== 2. 營主登入驗證 =====
          // 查詢啟用狀態的營主帳號
          const [owners] = await db.execute(
            'SELECT * FROM owners WHERE email = ? AND status = 1',
            [credentials.email]
          );

          const owner = owners[0];
          if (owner) {
            // 密碼驗證
            const hashedPassword = crypto
              .createHash('md5')
              .update(credentials.password)
              .digest('hex');
            
            if (hashedPassword === owner.password) {
              // 返回營主資訊
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

          // ===== 3. 一般用戶登入驗證 =====
          // 查詢啟用狀態的用戶帳號
          const [users] = await db.execute(
            'SELECT * FROM users WHERE email = ? AND status = 1',
            [credentials.email]
          );

          const user = users[0];
          if (user) {
            // 密碼驗證
            const hashedPassword = crypto
              .createHash('md5')
              .update(credentials.password)
              .digest('hex');
            
            if (hashedPassword === user.password) {
              // 返回用戶資訊
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

          // 驗證失敗返回 null
          return null;
        } catch (error) {
          console.error('Auth Error:', error);
          return null;
        }
      }
    })
  ],

  // ===== Token 和 Session 處理 =====
  callbacks: {
    // JWT Token 處理：當建立或更新 token 時觸發
    async jwt({ token, user }) {
      if (user) {
        // 將用戶資訊合併到 token 中
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

    // Session 處理：當建立或更新 session 時觸發
    async session({ session, token }) {
      if (token) {
        // 將 token 資訊合併到 session 中
        session.user = {
          ...session.user,
          // 根據用戶類型設置對應的 ID
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
    }
  },

  // ===== 自定義頁面路徑 =====
  pages: {
    signIn: '/auth/login',    // 登入頁面
    signOut: '/auth/logout',  // 登出頁面
    error: '/auth/error',     // 錯誤頁面
  },

  // ===== Session 配置 =====
  session: {
    strategy: 'jwt',          // 使用 JWT 策略
    maxAge: 30 * 24 * 60 * 60, // Session 有效期：30天
    updateAge: 24 * 60 * 60,   // 更新間隔：1天
  },

  // ===== JWT 配置 =====
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,  // JWT 密鑰
    maxAge: 30 * 24 * 60 * 60,           // Token 有效期：30天
  },

  // ===== 開發模式配置 =====
  debug: process.env.NODE_ENV === 'development',
};

// ===== NextAuth 處理器 =====
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
