# 露營探索家 Camp Explorer

這是一個使用 Next.js 建立的現代化露營預訂平台。

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

## 專案特色

### 前端特色
- 🚀 使用 App Router 實現快速導航
- 💅 整合 Bootstrap 5 與 Tailwind CSS
- 🔒 完整的身份驗證系統
- 📱 響應式設計，支援各種設備
- 🌙 支援深色模式
- 🔍 整合搜尋功能
- 🗺️ 整合地圖功能
- 📊 數據視覺化

### 後端特色
- 🔐 JWT 身份驗證
- 📨 電子郵件通知系統
- 💳 多元支付整合（LINE Pay、ECPay）
- 🔄 WebSocket 即時通訊
- 📁 檔案上傳處理
- 🗄️ 資料庫交易處理

## 開始使用

### 環境要求
- Node.js 18.x 或更高
- MySQL 8.0 或更高
- npm 9.x 或更高

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

3. 設定環境變數
```bash
cp .env.example .env.local
```

4. 啟動開發伺服器
```bash
# 同時啟動前端和後端服務
npm run dev
```

## 專案結構

```
camp-explorer/
├── src/
│   ├── app/                 # 頁面和 API 路由
│   ├── components/         # React 組件
│   ├── lib/                # 工具函數和配置
│   └── styles/            # 樣式文件
├── public/                # 靜態資源
├── prisma/               # Prisma配置和遷移
└── config/               # 配置文件
```

## 部署

本專案可以部署到以下平台：
- [Vercel](https://vercel.com)
- [Railway](https://railway.app)

## 開發團隊

- 前端開發：[開發者名稱]
- 後端開發：[開發者名稱]
- UI/UX 設計：[設計師名稱]

## 授權

此專案使用 MIT 授權 - 查看 [LICENSE](LICENSE) 檔案了解更多細節。

## 更新日誌

### [1.0.0] - 2024-03-XX
- 初始版本發布
- 基本功能實現
- 使用者介面完成
