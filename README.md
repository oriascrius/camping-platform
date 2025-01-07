# 露營探索家 Camp Explorer

這是一個使用 [Next.js](https://nextjs.org) 建立的現代化露營預訂平台。

## 技術棧

### 前端
- **Next.js 14** - React 框架，使用 App Router
- **Tailwind CSS** - 用於樣式設計
- **React Icons** - 圖標庫
- **React Toastify** - 通知提示
- **Next-Auth** - 身份驗證
- **date-fns** - 日期處理
- **Headless UI** - 無樣式 UI 組件

### 後端
- **MySQL** - 資料庫
- **Node.js** - 運行環境
- **bcryptjs** - 密碼加密
- **JWT** - 身份驗證令牌

## 功能特點

- 🏕️ 活動瀏覽與搜尋
- 👤 用戶註冊與登入
- 🛒 購物車功能
- ❤️ 收藏功能
- 💳 線上預訂
- 📱 響應式設計

## 開始使用

### 環境要求
- Node.js 18.0 或更高版本
- MySQL 8.0 或更高版本
- npm 或 yarn

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
.env.example是範本沒有全部實際資料
所以需要 clone 專案後，自行創建 .env.local
並貼上實際資料，.gitignore 會忽略 .env.local 不會上傳
- 複製 `.env.example` 到 `.env.local`
```bash
cp .env.example .env.local
```

- 設置環境變數：
  - 基本數據庫設置（如需要修改）：
    ```env
    DB_HOST=localhost
    DB_USER=root
    DB_PASSWORD=你的密碼
    DB_NAME=camp_explorer_db
    ```
  
  - 向專案組長獲取以下配置值：
    - JWT_SECRET（用於 JWT 驗證）
    - NEXTAUTH_SECRET（用於 NextAuth）
    - CWB_API_KEY（中央氣象局 API）
    - SMTP 相關設定（用於郵件功能）

4. 資料庫設定
```bash
# 在 MySQL 中創建數據庫
mysql -u root -p
CREATE DATABASE camp_explorer_db;
```

5. 啟動開發伺服器
```bash
# 同時啟動前端和後端服務
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
│   ├── app/             # 頁面和 API 路由
│   ├── components/      # React 組件
│   ├── lib/            # 工具函數和配置
│   └── styles/         # 全局樣式
├── public/             # 靜態資源
└── prisma/            # 資料庫結構
```

## API 文檔

主要 API 端點：
- `/api/auth/*` - 身份驗證相關
- `/api/activities/*` - 活動相關
- `/api/cart/*` - 購物車相關
- `/api/favorites/*` - 收藏相關

## 部署

本專案可以部署到以下平台：
- [Vercel](https://vercel.com)
- [Railway](https://railway.app)
- 任何支持 Node.js 的雲平台

## 開發團隊

- 前端開發：[開發者名稱]
- 後端開發：[開發者名稱]
- UI/UX 設計：[設計師名稱]

## 授權

本專案採用 MIT 授權條款 - 查看 [LICENSE](LICENSE) 檔案了解更多細節。

## 貢獻指南

1. Fork 本專案
2. 創建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 支援

如有任何問題或建議，請：
- 開啟 Issue
- 發送郵件至：[support@example.com]
- 訪問我們的[幫助中心](https://example.com/help)
