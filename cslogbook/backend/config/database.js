const mysql = require('mysql2/promise');
const validateEnv = require('../utils/validateEnv');

// Validate database environment variables with better error handling
if (!validateEnv('database')) {
  console.error('Database configuration is incomplete. Please check your .env file.');
  process.exit(1);
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
});

// ตั้งค่า collation หลังจากเชื่อมต่อ
pool.getConnection()
  .then(async connection => {
    try {
      await connection.execute('SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci');
      console.log('Database connected successfully');
    } finally {
      connection.release();
    }
  })
  .catch(err => {
    console.error('Error connecting to the database:', err);
  });

module.exports = pool;