// ===== 核心套件引入 =====
import NextAuth from 'next-auth';  // NextAuth 身份驗證框架：用於處理使用者認證和授權
import CredentialsProvider from 'next-auth/providers/credentials';  // 憑證驗證提供者：處理帳號密碼登入
import GoogleProvider from "next-auth/providers/google";

// ===== 工具套件引入 =====
import bcrypt from 'bcryptjs';  // 密碼加密工具：用於密碼的雜湊加密與驗證

// ===== 資料庫連接引入 =====
import db from '@/lib/db';  // MySQL 資料庫連接：用於資料的存取與管理
import { showLoginAlert } from "@/utils/sweetalert";  // 引入 sweetalert

const DEFAULT_AVATAR = '/images/default-avatar.png';  // 預設頭像路徑

export const authOptions = {
  // ===== 驗證提供者設定：定義如何處理登入請求 =====
  providers: [
    // ===== 添加 Google 驗證提供者 =====
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
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
              console.log('=== 管理員登入成功 ===');
              // 更新管理員登入資訊：記錄登入時間和 IP
              await db.execute(
                'UPDATE admins SET login_at = NOW(), login_ip = ? WHERE id = ?',
                [credentials.ip || null, admin.id]
              );

              // 回傳管理員資料：包含身份識別和權限資訊
              const adminData = {
                id: `admin_${admin.id}`,
                name: admin.name,
                email: admin.email,
                role: admin.role,
                isAdmin: true,
                isOwner: false,
                adminId: admin.id,
                adminRole: admin.role
              };
              
              console.log('管理員資料:', adminData);
              return adminData;
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
              console.log('=== 營地主登入成功 ===');
              // 回傳營地主資料結構，確保包含 id
              const ownerData = {
                id: owner.id,           // 添加 id 欄位
                name: owner.name,
                email: owner.email,
                role: 'owner',
                isAdmin: false,
                isOwner: true,
                ownerId: owner.id
              };
              
              console.log('營地主資料:', ownerData);
              return ownerData;
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
              console.log('=== 一般會員登入成功 ===');
              // 當用戶登入成功時，更新 last_login 和 login_type
              await db.execute(
                'UPDATE users SET last_login = NOW(), login_type = ? WHERE id = ?',
                ['email', user.id]
              );

              // 處理頭像路徑
              const avatarPath = user.avatar 
                ? user.avatar.startsWith('http') || user.avatar.startsWith('/') 
                  ? user.avatar 
                  : `/images/member/${user.avatar}`
                : DEFAULT_AVATAR;

              const userData = {
                id: user.id.toString(),
                name: user.name,
                email: user.email,
                role: 'user',
                isAdmin: false,
                isOwner: false,
                userId: user.id,
                avatar: avatarPath,
                level_id: user.level_id
              };
              
              console.log('會員資料:', userData);
              return userData;
            }
          }

          // 驗證失敗回傳空值
          return null;
        } catch (error) {
          await showLoginAlert.error('身份驗證發生錯誤');
          return null;
        }
      }
    })
  ],

  // ===== 回調函數設定：定義身份驗證過程中的關鍵處理邏輯 =====
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          console.log("=== Google 登入檢查開始 ===");
          
          // 1. 檢查是否已存在相同信箱的用戶
          const [users] = await db.execute(
            'SELECT * FROM users WHERE email = ?',
            [user.email]
          );

          const existingUser = users[0];
          
          if (existingUser) {
            // 如果用戶存在，檢查登入類型
            if (existingUser.login_type === 'google') {
              console.log('=== Google 會員登入成功 ===');
              await db.execute(
                `UPDATE users SET 
                  last_login = NOW(),
                  name = ?,
                  avatar = ?
                WHERE id = ?`,
                [
                  user.name || existingUser.name,
                  user.image || existingUser.avatar || DEFAULT_AVATAR,
                  existingUser.id
                ]
              );
              
              // 設置用戶 ID 供後續使用
              user.userId = existingUser.id;
              user.level_id = existingUser.level_id;
              console.log('Google 會員資料:', user);
              return true;
            } else {
              // 是 email 帳號，拒絕登入
              throw new Error("此信箱已使用一般帳號註冊，請使用密碼登入");
            }
          }

          // 2. 如果是全新用戶，創建帳號
          console.log("創建新 Google 用戶");
          const [result] = await db.execute(
            `INSERT INTO users (
              email,
              name,
              password,
              phone,
              birthday,
              gender,
              address,
              avatar,
              status,
              login_type,
              created_at,
              updated_at
            ) VALUES (
              ?, ?, 
              '', 
              '', 
              '2000-01-01',
              'male',
              '',
              ?,
              1,
              'google',
              NOW(),
              NOW()
            )`,
            [
              user.email,
              user.name || '',
              user.image || DEFAULT_AVATAR
            ]
          );

          console.log("新用戶創建成功，ID:", result.insertId);
          user.userId = result.insertId;
          user.level_id = 1;
          return true;

        } catch (error) {
          console.error("Google 登入錯誤:", error);
          return `/auth/login?error=${encodeURIComponent(error.message)}`;
        }
      }
      return true;
    },

    async jwt({ token, user, account }) {
      console.log("\n=== 觸發 JWT callback ===");
      if (user) {
        if (account?.provider === "google") {
          // Google 登入用戶的 token 設定
          token.userId = user.userId;
          token.loginType = 'google';
          return {
            ...token,
            id: user.userId,
            role: 'user',
            isAdmin: false,
            isOwner: false,
            userId: user.userId,
            name: user.name,
            email: user.email,
            avatar: user.avatar || DEFAULT_AVATAR,
            level_id: user.level_id
          };
        } else {
          // 針對 owner 登入添加處理
          if (user.isOwner) {
            console.log('營主 JWT 設置:', user);
            token.id = user.id;
            token.ownerId = user.ownerId;
          }
          return {
            ...token,
            ...user
          };
        }
      }
      return token;
    },

    // 工作階段處理：管理使用者登入狀態
    async session({ session, token }) {
      console.log("\n=== 觸發 Session callback ===");
      if (token) {
        session.user = {
          ...session.user,
          id: token.userId,
          role: token.role,
          isAdmin: token.isAdmin,
          isOwner: token.isOwner,
          loginType: token.loginType,
          name: token.name,
          email: token.email,
          userId: token.userId,
          avatar: token.avatar || DEFAULT_AVATAR,
          level_id: token.level_id
        };
        
        // 針對 owner 添加額外處理
        if (token.isOwner) {
          console.log('營主 Session 設置:', token);
          session.user.id = token.id;
          session.user.ownerId = token.ownerId;
        }
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
        await showLoginAlert.error('登出過程發生錯誤');
        return false;
      }
    },
  },

  // ===== 系統配置設定 =====
  // 自定義頁面路徑：指定身份驗證相關的頁面位置
  pages: {
    signIn: '/auth/login',    // 登入頁面
    signOut: '/auth/logout',  // 登出頁面
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
