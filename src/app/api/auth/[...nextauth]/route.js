import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import crypto from 'crypto';
import pool from '@/lib/db';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('請輸入信箱和密碼');
        }

        try {
          // MD5 加密密碼
          const hashedPassword = crypto
            .createHash('md5')
            .update(credentials.password)
            .digest('hex');

          // 先查詢管理員
          const [admins] = await pool.query(
            'SELECT * FROM admins WHERE email = ? AND status = 1',
            [credentials.email]
          );

          if (admins.length > 0) {
            const admin = admins[0];
            
            // 直接比對 MD5 加密後的密碼
            if (hashedPassword !== admin.password) {
              throw new Error('信箱或密碼錯誤');
            }

            // 更新最後登入時間和 IP
            await pool.query(
              'UPDATE admins SET login_at = NOW(), login_ip = ? WHERE id = ?',
              [credentials.ip || null, admin.id]
            );

            return {
              id: admin.id,
              name: admin.name,
              email: admin.email,
              role: admin.role === 2 ? 'super_admin' : 'admin'
            };
          }

          // 查詢一般會員
          const [users] = await pool.query(
            'SELECT * FROM users WHERE email = ?',
            [credentials.email]
          );

          if (users.length > 0) {
            const user = users[0];
            
            // 直接比對 MD5 加密後的密碼
            if (hashedPassword !== user.password) {
              throw new Error('信箱或密碼錯誤');
            }

            return {
              id: user.id,
              name: user.name,
              email: user.email,
              role: 'user'
            };
          }

          throw new Error('信箱或密碼錯誤');

        } catch (error) {
          console.error('登入錯誤:', error);
          throw error;
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
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        if (!session.user) {
          session.user = {};
        }
        session.user = {
          ...session.user,
          id: token.userId,
          role: token.role,
          name: token.name,
          email: token.email
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
