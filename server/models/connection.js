const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

console.log('=== 資料庫連線設定 ===');
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

console.log('資料庫設定:', {
  host: dbConfig.host,
  user: dbConfig.user,
  database: dbConfig.database,
  port: dbConfig.port
});

const pool = mysql.createPool(dbConfig);

// 測試連線
pool.getConnection()
  .then(connection => {
    console.log('✅ 資料庫連線成功');
    connection.release();
  })
  .catch(err => {
    console.error('❌ 資料庫連線失敗:', err.message);
    console.error('錯誤詳情:', err);
    console.error('請確認 .env.local 檔案中的資料庫設定是否正確');
  });

module.exports = pool;
