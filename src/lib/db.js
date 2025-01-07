import mysql from 'mysql2/promise';

// 建立資料庫連接池
const db = mysql.createPool({
  host: process.env.DB_HOST,          // 資料庫主機位址
  port: process.env.DB_PORT || 3306,  // 資料庫埠號，預設 3306
  user: process.env.DB_USER,          // 資料庫使用者名稱
  password: process.env.DB_PASSWORD,  // 資料庫密碼
  database: process.env.DB_NAME,      // 資料庫名稱
  
  // 連接池設定
  waitForConnections: true,           // 等待連接（若無可用連接）
  connectionLimit: process.env.DB_CONNECTION_LIMIT || 10,  // 最大連接數
  queueLimit: 0,                      // 隊列限制（0 表示無限）
  
  // 時區設定
  timezone: process.env.DB_TIMEZONE || '+08:00',  // 預設使用台灣時區
  
  // 連接保持設定
  enableKeepAlive: true,             // 啟用連接保持
  keepAliveInitialDelay: 0,          // 初始延遲時間
});

// 測試資料庫連接
const testConnection = async () => {
  try {
    const connection = await db.getConnection();  // 嘗試獲取連接
    console.log('數據庫連接成功');               // 連接成功提示
    connection.release();                         // 釋放連接回連接池
  } catch (error) {
    console.error('數據庫連接失敗:', error);     // 連接失敗錯誤提示
    throw error;                                 // 拋出錯誤
  }
};

// 啟動時測試連接
testConnection();

// 導出資料庫連接池供其他模組使用
export default db;