const authService = require('../services/authService');
const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');
const moment = require('moment-timezone');

// Login validation middleware
exports.validateLogin = [
    body('username')
        .trim()
        .notEmpty().withMessage('กรุณากรอกชื่อผู้ใช้')
        .isLength({ min: 3 }).withMessage('ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร'),
    body('password')
        .notEmpty().withMessage('กรุณากรอกรหัสผ่าน')
        .isLength({ min: 6 }).withMessage('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
];

exports.login = async (req, res) => {
    try {
        // Add debug logging
        console.log('Login attempt:', {
            username: req.body.username,
            timestamp: moment().tz('Asia/Bangkok').format()
        });

        // Validate request body
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: errors.array()[0].msg
            });
        }

        const { username, password, redirectPath } = req.body;

        // Use authService for complete authentication
        const result = await authService.authenticateUser(username, password);

        if (!result.success) {
            return res.status(result.statusCode || 500).json({
                success: false,
                message: result.message
            });
        }

        // Log successful login
        logger.info('User logged in successfully', {
            userId: result.data.userId,
            role: result.data.role,
            timestamp: moment().tz('Asia/Bangkok').format()
        });

        // ดึง path ที่ user พยายามจะเข้าถึง; ถ้าไม่มีให้ใช้ /dashboard เป็นค่าเริ่มต้น
        const finalRedirectPath = redirectPath || '/dashboard';

        // Send response
        res.json({
            success: true,
            token: result.data.token,
            userId: result.data.userId,
            firstName: result.data.firstName,
            lastName: result.data.lastName,
            email: result.data.email,
            role: result.data.role,
            teacherType: result.data.teacherType, // เพิ่ม teacherType
            redirectPath: finalRedirectPath, // เพิ่ม redirect path
            ...result.data
        });

    } catch (error) {
        // Enhanced error logging
        console.error('Login error details:', {
            message: error.message,
            stack: error.stack,
            time: moment().tz('Asia/Bangkok').format()
        });

        res.status(500).json({
            success: false,
            message: process.env.NODE_ENV === 'development' 
                ? `เกิดข้อผิดพลาด: ${error.message}`
                : 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ'
        });
    }
};

// Refresh token handler
exports.refreshToken = async (req, res) => {
    try {
        const result = await authService.refreshUserToken(req.user.userId);

        if (!result.success) {
            return res.status(result.statusCode || 500).json({
                success: false,
                message: result.message
            });
        }

        res.json({
            success: true,
            token: result.data.token
        });
    } catch (error) {
        logger.error('Refresh token error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Logout handler
exports.logout = async (req, res) => {
    try {
        // Log logout attempt
        logger.info('User logout attempt', {
            userId: req.user?.userId,
            timestamp: moment().tz('Asia/Bangkok').format()
        });

        // Add logout logic here if needed (e.g., blacklist token, clear session)
        res.json({
            success: true,
            message: 'ออกจากระบบเรียบร้อยแล้ว'
        });
    } catch (error) {
        logger.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการออกจากระบบ'
        });
    }
};