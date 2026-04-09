const jwt = require('jsonwebtoken');
const authService = require('../services/authService');
const logger = require('../utils/logger');
const moment = require('moment-timezone');
const tokenBlacklist = require('../utils/tokenBlacklist');

exports.login = async (req, res, next) => {
    try {
        // ใช้ validated data จาก validator middleware
        const { username, password, redirectPath } = req.validated || req.body;

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
        logger.error('Login error details:', {
            message: error.message,
            stack: error.stack,
            time: moment().tz('Asia/Bangkok').format()
        });
        next(error);
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

        // Blacklist token จนกว่าจะหมดอายุ
        const token = req.headers['authorization']?.split(' ')[1];
        if (token) {
            const decoded = jwt.decode(token);
            if (decoded?.jti && decoded?.exp) {
                tokenBlacklist.add(decoded.jti, decoded.exp * 1000);
            }
        }

        // บันทึก SystemLog (audit trail)
        try {
            const { logAction } = require('../utils/auditLog');
            logAction('LOGOUT', `ออกจากระบบ — userId: ${req.user?.userId}`, { userId: req.user?.userId });
        } catch (_) { /* audit log is optional */ }

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