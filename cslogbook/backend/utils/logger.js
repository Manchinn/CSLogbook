const winston = require('winston');

const logger = winston.createLogger({
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/auth.log' }),
        // เพิ่ม transport สำหรับ SQL query
        new winston.transports.File({ filename: 'logs/sql.log', level: 'info' })
    ]
});

// เพิ่มฟังก์ชันสำหรับ log SQL queries
logger.sqlQuery = (query, params) => {
    logger.info({
        type: 'SQL_QUERY',
        query,
        params,
        timestamp: new Date().toISOString()
    });
};

module.exports = logger;