const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

console.log('=== 資料庫連線設定 ===');

// 資料庫連線設定
const pool = mysql.createPool({
  // 優先使用 DATABASE_URL，如果沒有則使用個別設定
  ...(process.env.DATABASE_URL
    ? { uri: process.env.DATABASE_URL }
    : {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306,
      }),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

console.log('資料庫設定:', {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306
});

// 測試連線
pool.getConnection()
  .then((connection) => {
    console.log('✅ 資料庫連線成功');
    connection.release();
  })
  .catch((err) => {
    console.error('❌ 資料庫連線失敗:', err);
  });

module.exports = pool;
