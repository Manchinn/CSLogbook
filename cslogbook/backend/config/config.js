require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER ,
    password: process.env.DB_PASSWORD ,
    database: process.env.DB_NAME ,
    host: process.env.DB_HOST,
    dialect: "mysql",
    timezone: '+07:00',
    logging: console.log,
    define: {
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    },
    pool: {
      max: 10,     // เพิ่มจาก 5 เป็น 10 เพื่อรองรับการทำงานพร้อมกัน
      min: 2,      // เพิ่มจาก 0 เป็น 2 เพื่อให้มี connection พร้อมใช้
      acquire: 60000, // เพิ่มจาก 30000 เป็น 60000 ms
      idle: 15000,   // เพิ่มจาก 10000 เป็น 15000 ms
      evict: 15000   // เพิ่ม eviction time
    }
  },
  test: {
    username: process.env.TEST_DB_USER,
    password: process.env.TEST_DB_PASSWORD,
    database: process.env.TEST_DB_NAME,
    host: process.env.TEST_DB_HOST,
    dialect: "mysql",
    logging: false
  },
  production: {
    username: process.env.PROD_DB_USER,
    password: process.env.PROD_DB_PASSWORD,
    database: process.env.PROD_DB_NAME,
    host: process.env.PROD_DB_HOST,
    dialect: "mysql",
    logging: false,
    pool: {
      max: 25,     // เพิ่มตาม concurrent users
      min: 5,      // รักษา connections ขั้นต่ำ
      acquire: 60000,
      idle: 20000,
      evict: 20000
    }
  }
};
