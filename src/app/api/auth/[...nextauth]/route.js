import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import crypto from 'crypto';
import mysql from 'mysql2/promise';

// MySQL 連接配置
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          const connection = await mysql.createConnection(dbConfig);
          
          // 檢查管理員登入
          const [admins] = await connection.execute(
            'SELECT * FROM admins WHERE email = ? AND status = 1',
            [credentials.email]
          );

          const admin = admins[0];
          
          if (admin) {
            // 使用 MD5 加密比對密碼
            const hashedPassword = crypto
              .createHash('md5')
              .update(credentials.password)
              .digest('hex');
            
            if (hashedPassword === admin.password) {
              // 更新最後登入時間和 IP
              await connection.execute(
                'UPDATE admins SET login_at = NOW(), login_ip = ? WHERE id = ?',
                [credentials.ip || null, admin.id]
              );

              await connection.end();
              
              return {
                id: `admin_${admin.id}`,
                name: admin.name,
                email: admin.email,
                role: admin.role === 2 ? 'super_admin' : 'admin',
                isAdmin: true,
                adminId: admin.id,
                adminRole: admin.role
              };
            }
          }

          // 如果不是管理員，檢查一般用戶
          const [users] = await connection.execute(
            'SELECT * FROM users WHERE email = ?',
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
              return {
                id: user.id.toString(),
                name: user.name,
                email: user.email,
                role: 'user',
                isAdmin: false,
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
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.userId = user.id;
        token.name = user.name;
        token.email = user.email;
        token.isAdmin = user.isAdmin;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          ...session.user,
          id: token.userId,
          role: token.role,
          name: token.name,
          email: token.email,
          isAdmin: token.isAdmin
        };
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/logout',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
