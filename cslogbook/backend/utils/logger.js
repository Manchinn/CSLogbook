/**
 * Logger Utility
 * ใช้สำหรับบันทึก log ต่างๆ ในระบบอย่างเป็นระบบ
 */

const winston = require('winston');
const fs = require('fs');
const path = require('path');

const isJest = Boolean(process.env.JEST_WORKER_ID);
const isTestEnv = isJest || process.env.NODE_ENV === 'test';

// สร้างโฟลเดอร์ logs เฉพาะตอนรันจริง เพื่อลด file handle ค้างใน Jest
const logDir = path.join(__dirname, '../logs');
if (!isTestEnv && !fs.existsSync(logDir)) {
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

const resolveConsoleLogging = () => {
  if (typeof process.env.LOG_ENABLE_CONSOLE !== 'undefined') {
    return process.env.LOG_ENABLE_CONSOLE !== 'false';
  }
  if (isTestEnv) {
    return false;
  }
  // ใน production ปิด console เพื่อไม่ให้ stdout รก ยกเว้นตั้งค่าเปิดไว้ชัดเจน
  return process.env.NODE_ENV !== 'production';
};

// สร้าง logger ด้วย winston
const transports = [];

if (!isTestEnv) {
  transports.push(
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
        winston.format((info) => {
          const message = (info.message || '').toLowerCase();
          const hasAgentKeyword = message.includes('agent');

          if (!hasAgentKeyword && !info.agent) {
            return false; // ข้าม log ที่ไม่เกี่ยวข้องกับ agent
          }

          return info;
        })(),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        winston.format.printf((info) => `[${info.timestamp}] ${info.level.toUpperCase()}: ${info.message}`)
      )
    })
  );
}

if (resolveConsoleLogging()) {
  transports.push(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
    silent: isTestEnv // ปิด console ตอนรัน Jest เพื่อลด noise
  }));
} else if (isTestEnv) {
  // สำหรับ Jest ให้ใช้งาน console transport แบบ silent เพื่อหลีกเลี่ยง warning ของ Winston
  transports.push(new winston.transports.Console({ silent: true }));
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info', // ระดับการบันทึก log (debug, info, warn, error)
  format: logFormat,
  defaultMeta: { service: 'cslogbook' },
  transports
});

if (!isTestEnv) {
  // เพิ่ม transport สำหรับบันทึก log ของการ authentication
  logger.add(new winston.transports.File({ 
    filename: path.join(logDir, 'auth.log'),
    level: 'info',
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    format: winston.format.combine(
      winston.format((info) => {
        const message = info.message ? info.message.toLowerCase() : '';
        const matched = message.includes('login')
          || message.includes('auth')
          || message.includes('password')
          || message.includes('jwt')
          || message.includes('token')
          || message.includes('user:');

        if (!matched) {
          return false; // ข้าม log ที่ไม่เกี่ยวข้องกับการ authenticate
        }

        return info;
      })(),
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
      winston.format.printf((info) => `[${info.timestamp}] ${info.level.toUpperCase()}: ${info.message}`)
    )
  }));

  // เพิ่ม transport สำหรับบันทึกเฉพาะ log หมวดการแจ้งเตือน (notification emails)
  logger.add(new winston.transports.File({
    filename: path.join(logDir, 'notifications.log'),
    level: 'info',
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    format: winston.format.combine(
      winston.format((info) => {
        const msg = info.message || '';
        const matched = info.notificationType || /(การแจ้งเตือน|logbook|อนุมัติ|ประเมิน)/i.test(msg);

        if (!matched) {
          return false; // ข้าม log ที่ไม่เกี่ยวข้องกับการแจ้งเตือน
        }

        return info;
      })(),
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
      winston.format.printf((info) => {
        const msg = info.message || '';
        const base = `[${info.timestamp}] ${info.level.toUpperCase()}: ${msg}`;

        const notificationMeta = info.notificationType ? ` {"notificationType":"${info.notificationType}"}` : '';

        // ตรรกะนี้ต้องใช้ JSON.stringify ต่อท้าย meta จึงระบุคอมเมนต์ไทยชี้แจง
        const extraMetaEntries = Object.entries(info).filter(([key]) => !['level', 'message', 'timestamp', 'notificationType', 'service'].includes(key));
        const extraMeta = extraMetaEntries.length > 0 ? ` ${JSON.stringify(Object.fromEntries(extraMetaEntries))}` : '';

        return `${base}${notificationMeta}${extraMeta}`;
      })
    )
  }));
}

// Export logger
module.exports = logger;