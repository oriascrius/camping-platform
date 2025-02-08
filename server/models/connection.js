const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

console.log('=== 資料庫連線設定 ===');

/**
 * 資料庫連線池配置
 * 使用連線池可以：
 * 1. 自動管理連線數量
 * 2. 提高效能
 * 3. 避免連線過多導致資料庫負擔
 * 4. 自動重新連線
 */
const pool = mysql.createPool({
  // 優先使用 DATABASE_URL 環境變數（如 Heroku）
  // 如果沒有則使用個別設定
  ...(process.env.DATABASE_URL
    ? { uri: process.env.DATABASE_URL }
    : {
        // 資料庫主機位置
        host: process.env.DB_HOST,
        // 資料庫使用者名稱
        user: process.env.DB_USER,
        // 資料庫密碼
        password: process.env.DB_PASSWORD,
        // 資料庫名稱
        database: process.env.DB_NAME,
        // 資料庫連接埠（預設 3306）
        port: process.env.DB_PORT || 3306,
      }),
  
  // 等待連線設定
  waitForConnections: true,  // 當無連線可用時，等待而不是立即返回錯誤
  
  // 連線池最大連線數
  connectionLimit: 10,  // 同時最多允許 10 個連線
  
  // 等待隊列限制
  queueLimit: 0  // 0 表示不限制等待隊列長度
});

// 輸出當前資料庫設定（不包含敏感資訊）
console.log('資料庫設定:', {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306
});

/**
 * 測試資料庫連線
 * 1. 嘗試建立連線
 * 2. 如果成功則立即釋放連線
 * 3. 如果失敗則輸出錯誤訊息
 */
pool.getConnection()
  .then((connection) => {
    console.log('✅ 資料庫連線成功');
    // 釋放連線回連線池
    connection.release();
  })
  .catch((err) => {
    console.error('❌ 資料庫連線失敗:', err);
  });

// 導出連線池供其他模組使用
module.exports = pool;
