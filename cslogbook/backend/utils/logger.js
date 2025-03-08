const winston = require('winston');
const { format } = winston;

// Custom format for better readability
const customFormat = format.printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level.toUpperCase()}]: ${message}`;
  
  if (metadata.sql) {
    msg += `\nSQL: ${metadata.sql}`;
  }
  
  if (metadata.error) {
    msg += `\nError: ${metadata.error.message}`;
    msg += `\nStack: ${metadata.error.stack}`;
  }

  return msg;
});

const logger = winston.createLogger({
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.colorize(),
    customFormat
  ),
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({ 
      filename: 'logs/app.log',
      maxsize: 5242880,
      maxFiles: 5 
    }),
    new winston.transports.Console({
      format: format.combine(
        format.colorize(),
        customFormat
      )
    })
  ]
});

// Helper functions for specific log types
logger.database = (sql, params) => {
  logger.info('Database Query', {
    sql,
    params,
    type: 'DATABASE'
  });
};

logger.auth = (message, userId) => {
  logger.info(message, {
    userId,
    type: 'AUTH'
  });
};

module.exports = logger;