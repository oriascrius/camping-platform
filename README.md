# 露營探索家 Camp Explorer

這是一個使用 [Next.js](https://nextjs.org) 建立的現代化露營預訂平台。

## 技術棧

### 前端
- **Next.js 14** - React 框架，使用 App Router
- **React 18** - 使用最新的React特性
- **Bootstrap 5** - UI框架，用於響應式設計
- **Tailwind CSS** - 用於樣式設計
- **React Icons** - 圖標庫
- **React Toastify** - 通知提示
- **Next-Auth** - 身份驗證
- **date-fns** - 日期處理
- **Headless UI** - 無樣式 UI 組件
- **SWR** - 用於數據請求和緩存

### 後端
- **MySQL** - 資料庫
- **Node.js** - 運行環境
- **bcryptjs** - 密碼加密
- **JWT** - 身份驗證令牌
- **Prisma** - ORM工具
- **Express** - Node.js Web應用框架

## 功能特點

### 用戶功能
- 🏕️ 活動瀏覽與搜尋
- 👤 用戶註冊與登入
- 🛒 購物車功能
- ❤️ 收藏功能
- 💳 線上預訂
- 📱 響應式設計
- 🎫 優惠券系統
- 📝 評價與評論
- 📅 預訂歷史查看

### 營主功能
- 📊 營地管理
- 📈 訂單管理
- 🗓️ 檔期管理
- 💰 收益統計
- 📸 照片上傳管理

## 開始使用

### 環境要求
- Node.js 18.0 或更高版本
- MySQL 8.0 或更高版本
- npm 或 yarn
- Git

### 安裝步驟

1. 克隆專案
```bash
git clone https://github.com/your-username/camp-explorer.git
cd camp-explorer
```

2. 安裝依賴
```bash
npm install
```

3. 環境設定
- 複製 `.env.example` 到 `.env.local`
```bash
cp .env.example .env.local
```

- 設置環境變數：
  ```env
  # 基本設置
  NEXT_PUBLIC_BASE_URL=http://localhost:3000
  
  # 資料庫設置
  DB_HOST=localhost
  DB_USER=root
  DB_PASSWORD=你的密碼
  DB_NAME=camp_explorer_db
  DATABASE_URL="mysql://root:你的密碼@localhost:3306/camp_explorer_db"
  
  # JWT設置
  JWT_SECRET=你的JWT密鑰
  
  # NextAuth設置
  NEXTAUTH_SECRET=你的NextAuth密鑰
  NEXTAUTH_URL=http://localhost:3000
  
  # 第三方API
  CWB_API_KEY=中央氣象局API金鑰
  GOOGLE_CLIENT_ID=你的Google Client ID
  GOOGLE_CLIENT_SECRET=你的Google Client Secret
  
  # Email設置
  SMTP_HOST=smtp.gmail.com
  SMTP_PORT=587
  SMTP_USER=你的email
  SMTP_PASSWORD=你的密碼
  ```

4. 資料庫設定
```bash
# 在 MySQL 中創建數據庫
mysql -u root -p
CREATE DATABASE camp_explorer_db;

# 執行 Prisma 遷移
npx prisma migrate dev
```

5. 啟動開發伺服器
```bash
npm run dev
```

6. 開啟瀏覽器訪問：
   - 前端：[http://localhost:3000](http://localhost:3000)
   - 後端 API：[http://localhost:3002](http://localhost:3002)

### 注意事項
- 確保 MySQL 服務已啟動
- 確保所有環境變數都已正確設置
- 如遇到問題，請檢查：
  - 數據庫連接設置
  - 環境變數是否正確填寫
  - 端口 3000 和 3002 是否被占用

## 專案結構

```
camp-explorer/
├── src/
│   ├── app/                 # 頁面和 API 路由
│   │   ├── api/            # API 路由處理
│   │   ├── auth/           # 認證相關頁面
│   │   ├── camping/        # 營地相關頁面
│   │   ├── member/         # 會員相關頁面
│   │   ├── owner/          # 營主相關頁面
│   │   └── products/       # 商品相關頁面
│   ├── components/         # React 組件
│   │   ├── camping/        # 營地相關組件
│   │   ├── layout/         # 布局組件
│   │   ├── member/         # 會員相關組件
│   │   └── shared/         # 共用組件
│   ├── lib/                # 工具函數和配置
│   │   ├── db/            # 數據庫相關
│   │   ├── utils/         # 通用工具函數
│   │   └── validations/   # 驗證相關
│   └── styles/            # 樣式文件
├── public/                # 靜態資源
│   ├── images/           # 圖片資源
│   └── icons/            # 圖標資源
├── prisma/               # Prisma配置和遷移
└── config/               # 配置文件
```

## API 文檔

### 認證相關
- `POST /api/auth/register` - 用戶註冊
- `POST /api/auth/login` - 用戶登入
- `POST /api/auth/logout` - 用戶登出

### 營地相關
- `GET /api/camping/activities` - 獲取營地列表
- `GET /api/camping/activities/:id` - 獲取營地詳情
- `POST /api/camping/cart` - 添加到購物車
- `GET /api/camping/cart` - 獲取購物車內容

### 商品相關
- `GET /api/products` - 獲取商品列表
- `GET /api/products/:id` - 獲取商品詳情
- `POST /api/products/cart` - 添加到購物車

### 會員相關
- `GET /api/member/profile` - 獲取會員資料
- `PUT /api/member/profile` - 更新會員資料
- `GET /api/member/orders` - 獲取訂單歷史

## 部署

本專案可以部署到以下平台：
- [Vercel](https://vercel.com)
- [Railway](https://railway.app)
- [AWS](https://aws.amazon.com)
- [GCP](https://cloud.google.com)
- 任何支持 Node.js 的雲平台

## 開發團隊

- 前端開發：[開發者名稱]
- 後端開發：[開發者名稱]
- UI/UX 設計：[設計師名稱]
- 專案管理：[管理者名稱]

## 授權

本專案採用 MIT 授權條款 - 查看 [LICENSE](LICENSE) 檔案了解更多細節。

## 貢獻指南

1. Fork 本專案
2. 創建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 支援與問題回報

如有任何問題或建議，請：
- 開啟 Issue
- 發送郵件至：[support@example.com]
- 訪問我們的[幫助中心](https://example.com/help)

## 更新日誌

### [1.0.0] - 2024-03-XX
- 初始版本發布
- 基本功能實現
- 使用者介面完成

## 待辦事項
- [ ] 多語言支持
- [ ] 黑暗模式
- [ ] 社交媒體分享
- [ ] 更多支付方式
- [ ] 行動應用程式
