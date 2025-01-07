import mysql from 'mysql2/promise';

const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: process.env.DB_CONNECTION_LIMIT || 10,
  queueLimit: 0,
  timezone: process.env.DB_TIMEZONE || '+08:00',
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

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

testConnection();

export default db;