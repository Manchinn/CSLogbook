const mysql = require('mysql2/promise');
const validateEnv = require('../utils/validateEnv');
const logger = require('../utils/logger');

// Validate database environment variables
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
  connectionLimit: process.env.NODE_ENV === 'production' ? 20 : 10, // เพิ่มการตั้งค่าตาม environment
  queueLimit: 0,
  charset: 'utf8mb4',
  collation: 'utf8mb4_unicode_ci',
  timezone: '+07:00', // เพิ่มการตั้งค่า timezone
  multipleStatements: true, // เพิ่มเพื่อรองรับ transaction
/*   debug: process.env.NODE_ENV === 'development' ? 
    (msg) => logger.database(msg) : 
    false */
  debug: false
});

// ตั้งค่า collation และ connection
const initDatabase = async () => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    // ตั้งค่า collation
    await connection.execute('SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci');
    
    // ตั้งค่า session variables
    await connection.execute('SET SESSION time_zone = "+07:00"');
    await connection.execute('SET SESSION sql_mode = "STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE"');
    
    console.log('Database connected successfully');
    
    // ตรวจสอบการเชื่อมต่อเป็นระยะ
    setInterval(async () => {
      try {
        await pool.query('SELECT 1');
      } catch (err) {
        console.error('Database connection check failed:', err);
      }
    }, 60000); // ทุก 1 นาที

  } catch (err) {
    console.error('Error initializing database:', err);
    process.exit(1);
  } finally {
    if (connection) connection.release();
  }
};

// เริ่มการเชื่อมต่อ
initDatabase();

// Error handling
pool.on('error', (err) => {
  logger.error('Database Error', {
    error: err,
    type: 'DATABASE_ERROR'
  });
});

pool.on('acquire', () => {
  logger.info('Connection acquired from pool');
});

pool.on('release', () => {
  logger.info('Connection released back to pool');
});

module.exports = pool;