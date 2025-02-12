import mysql from 'mysql2/promise';

// 建立資料庫連接池
const db = mysql.createPool({
  // 優先使用 Railway/Vercel 環境變數
  host: process.env.MYSQLHOST || process.env.DB_HOST,
  user: process.env.MYSQLUSER || process.env.DB_USER,
  password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD,
  database: process.env.MYSQL_DATABASE || process.env.DB_NAME,
  port: process.env.MYSQLPORT || process.env.DB_PORT || 3306,
  
  // 連接池設定
  waitForConnections: true,
  connectionLimit: process.env.DB_CONNECTION_LIMIT || 10,
  queueLimit: 0,
  
  // 時區設定
  timezone: process.env.DB_TIMEZONE || '+08:00',
  
  // 連接保持設定
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// 測試資料庫連接
const testConnection = async () => {
  try {
    const connection = await db.getConnection();
    console.log('數據庫連接成功');
    connection.release();
  } catch (error) {
    console.error('數據庫連接失敗:', error);
    throw error;
  }
};

// 啟動時測試連接
testConnection();

// 導出資料庫連接池供其他模組使用
export default db;