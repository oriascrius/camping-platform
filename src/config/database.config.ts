// 資料庫設定
export const databaseConfig = {
  type: 'mysql',
  url: process.env.DATABASE_URL,
  entities: ['dist/**/*.entity{.ts,.js}'],
  synchronize: false,
  ssl: {
    rejectUnauthorized: true
  }
}; 