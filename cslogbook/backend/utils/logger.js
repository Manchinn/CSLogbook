/**
 * Logger Utility
 * ใช้สำหรับบันทึก log ต่างๆ ในระบบอย่างเป็นระบบ
 */

const winston = require('winston');
const fs = require('fs');
const path = require('path');

// สร้างโฟลเดอร์ logs ถ้ายังไม่มี
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// กำหนดรูปแบบของ log
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    
    // เพิ่มข้อมูลเพิ่มเติม (metadata) ถ้ามี
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    
    // เพิ่ม stack trace ในกรณีที่เป็น error
    if (stack) {
      log += `\n${stack}`;
    }
    
    return log;
  })
);

// สร้าง logger ด้วย winston
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info', // ระดับการบันทึก log (debug, info, warn, error)
  format: logFormat,
  defaultMeta: { service: 'cslogbook' },
  transports: [
    // บันทึก error ลงในไฟล์
    new winston.transports.File({ 
      filename: path.join(logDir, 'error.log'), 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 10,
    }),
    
    // บันทึก log ทั้งหมดลงในไฟล์
    new winston.transports.File({ 
      filename: path.join(logDir, 'app.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 10, 
    }),
    
    // บันทึก log เฉพาะส่วนของ agent ลงในไฟล์แยก
    new winston.transports.File({ 
      filename: path.join(logDir, 'agents.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        winston.format.printf(info => {
          // บันทึกเฉพาะ log ที่เกี่ยวข้องกับ agent
          if (info.message && (info.message.includes('Agent') || info.message.includes('agent'))) {
            return `[${info.timestamp}] ${info.level.toUpperCase()}: ${info.message}`;
          }
          return null;
        })
      )
    }),
    
    // แสดง log ใน console เมื่ออยู่ใน development mode
    ...(process.env.NODE_ENV !== 'production' ? [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      })
    ] : [])
  ]
});

// เพิ่ม transport สำหรับบันทึก log ของการ authentication
logger.add(new winston.transports.File({ 
  filename: path.join(logDir, 'auth.log'),
  level: 'info',
  maxsize: 5242880, // 5MB
  maxFiles: 5,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.printf(info => {
      // บันทึกเฉพาะ log ที่เกี่ยวข้องกับการ authenticate
      if (info.message && (
        info.message.includes('login') || 
        info.message.includes('auth') || 
        info.message.includes('password') ||
        info.message.includes('jwt') ||
        info.message.includes('token') ||
        info.message.includes('user:')
      )) {
        return `[${info.timestamp}] ${info.level.toUpperCase()}: ${info.message}`;
      }
      return null;
    })
  )
}));

// Export logger
module.exports = logger;