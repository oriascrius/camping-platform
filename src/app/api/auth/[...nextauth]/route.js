import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import crypto from 'crypto';
import mysql from 'mysql2/promise';

// ===== 資料庫連線設定 =====
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

export const authOptions = {
  // ===== 登入驗證提供者設定 =====
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      // ----- 登入驗證邏輯 -----
      async authorize(credentials) {
        try {
          const connection = await mysql.createConnection(dbConfig);
          
          // 1. 管理員登入驗證
          const [admins] = await connection.execute(
            'SELECT * FROM admins WHERE email = ? AND status = 1',
            [credentials.email]
          );

          const admin = admins[0];
          if (admin) {
            const hashedPassword = crypto
              .createHash('md5')
              .update(credentials.password)
              .digest('hex');
            
            if (hashedPassword === admin.password) {
              // 更新管理員登入時間
              await connection.execute(
                'UPDATE admins SET login_at = NOW(), login_ip = ? WHERE id = ?',
                [credentials.ip || null, admin.id]
              );

              await connection.end();
              // 回傳管理員資訊
              return {
                id: `admin_${admin.id}`,
                name: admin.name,
                email: admin.email,
                role: admin.role === 2 ? 'super_admin' : 'admin',
                isAdmin: true,
                isOwner: false,
                adminId: admin.id,
                adminRole: admin.role
              };
            }
          }

          // 2. 營主登入驗證
          const [owners] = await connection.execute(
            'SELECT * FROM owners WHERE email = ? AND status = 1',
            [credentials.email]
          );

          const owner = owners[0];
          if (owner) {
            const hashedPassword = crypto
              .createHash('md5')
              .update(credentials.password)
              .digest('hex');
            
            if (hashedPassword === owner.password) {
              await connection.end();
              // 回傳營主資訊
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

          // 3. 一般用戶登入驗證
          const [users] = await connection.execute(
            'SELECT * FROM users WHERE email = ? AND status = 1',
            [credentials.email]
          );

          const user = users[0];
          if (user) {
            const hashedPassword = crypto
              .createHash('md5')
              .update(credentials.password)
              .digest('hex');
            
            if (hashedPassword === user.password) {
              await connection.end();
              // 回傳用戶資訊
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

          await connection.end();
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
    // ----- JWT Token 處理 -----
    async jwt({ token, user }) {
      if (user) {
        // 將用戶資訊存入 token
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

    // ----- Session 處理 -----
    async session({ session, token }) {
      if (token) {
        // 將 token 資訊存入 session
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
    }
  },

  // ===== 頁面設定 =====
  pages: {
    signIn: '/auth/login',    // 登入頁面
    signOut: '/auth/logout',  // 登出頁面
    error: '/auth/error',     // 錯誤頁面
  },

  // ===== Session 設定 =====
  session: {
    strategy: 'jwt',          // 使用 JWT 策略
    maxAge: 30 * 24 * 60 * 60, // Session 有效期：30天
    updateAge: 24 * 60 * 60,   // 更新間隔：1天
  },

  // ===== JWT 設定 =====
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,  // JWT 密鑰
    maxAge: 30 * 24 * 60 * 60,           // Token 有效期：30天
  },

  // ===== 開發模式設定 =====
  debug: process.env.NODE_ENV === 'development',
};

// ===== NextAuth 處理器 =====
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
