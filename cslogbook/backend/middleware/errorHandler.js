// middleware/errorHandler.js
const logger = require('../utils/logger');
const multer = require('multer');

/**
 * Centralized error handler middleware
 * Format: { success: false, code: "ERROR_CODE", message: "..." }
 */
const errorHandler = (err, req, res, next) => {
  // Log error
  logger.error('Error in request:', {
    method: req.method,
    url: req.url,
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    userId: req.user?.userId
  });

  // Determine status code
  const statusCode = err.statusCode || err.status || 500;
  
  // Determine error code
  const code = err.code || 'INTERNAL_ERROR';
  
  // Determine message
  let message = err.message || 'เกิดข้อผิดพลาดในระบบ';
  
  // Handle Multer errors (file upload)
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      code: 'FILE_UPLOAD_ERROR',
      message: 'เกิดข้อผิดพลาดในการอัพโหลดไฟล์',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }

  // Handle specific error types
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'ข้อมูลไม่ถูกต้อง',
      errors: err.errors?.map(e => e.message) || []
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      code: 'DUPLICATE_ENTRY',
      message: 'ข้อมูลซ้ำในระบบ'
    });
  }

  if (err.name === 'SequelizeDatabaseError') {
    return res.status(500).json({
      success: false,
      code: 'DATABASE_ERROR',
      message: process.env.NODE_ENV === 'development' 
        ? err.message 
        : 'เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล'
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      code: 'INVALID_TOKEN',
      message: 'Token ไม่ถูกต้องหรือหมดอายุ'
    });
  }

  // Default error response
  res.status(statusCode).json({
    success: false,
    code,
    message: process.env.NODE_ENV === 'development' 
      ? message 
      : (statusCode === 500 ? 'เกิดข้อผิดพลาดในระบบ' : message)
  });
};

module.exports = errorHandler;
