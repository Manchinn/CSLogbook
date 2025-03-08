const pool = require('../config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { sendLoginNotification } = require('../utils/mailer');
const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');
const moment = require('moment-timezone');

// เพิ่ม middleware validation
exports.validateLogin = [
    body('username')
        .trim()
        .notEmpty().withMessage('กรุณากรอกชื่อผู้ใช้')
        .isLength({ min: 3 }).withMessage('ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร'),
    body('password')
        .notEmpty().withMessage('กรุณากรอกรหัสผ่าน')
        .isLength({ min: 6 }).withMessage('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
];

exports.login = async (req, res, next) => {
    // ตรวจสอบ validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    const { username, password } = req.body;
    logger.info('Login attempt', {
        username,
        timestamp: moment().tz('Asia/Bangkok').format(),
        ip: req.ip
    });
    try {
        // ปรับปรุง query ให้ดึงข้อมูลตาม schema ใหม่
        const [users] = await pool.execute(`
            SELECT u.*,
                   CASE 
                     WHEN u.role = 'student' THEN s.is_eligible_internship
                     ELSE NULL 
                   END as isEligibleForInternship,
                   CASE 
                     WHEN u.role = 'student' THEN s.is_eligible_project
                     ELSE NULL 
                   END as isEligibleForProject
            FROM users u
            LEFT JOIN students s ON u.user_id = s.user_id
            WHERE u.username = ? AND u.active_status = 1`,
            [username]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                error: "ชื่อผู้ใช้ไม่ถูกต้อง"
            });
        }

        const user = users[0];

        // เปรียบเทียบรหัสผ่านโดยใช้ bcrypt
        const isPasswordValid = await bcrypt.compare(password, user.password);
        console.log('Password match:', isPasswordValid);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                error: "รหัสผ่านผู้ใช้ไม่ถูกต้อง"
            });
        }

        // สร้าง JWT token
        const token = jwt.sign({
            userId: user.id,
            role: user.role,
            studentID: user.studentID,
            firstName: user.firstName,
            lastName: user.lastName,
        }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN
        });

        // เพิ่ม log ก่อนส่ง response
        console.log('Token created for user:', {
            userId: user.id,
            role: user.role,
            studentID: user.studentID
        });

        // ส่งอีเมลแจ้งเตือนการล็อกอิน
        const today = new Date().toDateString();
        if (user.lastLoginNotification !== today) {
            try {
                await sendLoginNotification(user.email, user.username);
                await pool.execute(
                    'UPDATE users SET lastLoginNotification = CURRENT_TIMESTAMP WHERE username = ?',
                    [user.username]
                );
            } catch (error) {
                console.error('Email notification error:', error);
            }
        }

        // เพิ่มการอัพเดท last_login
        await pool.execute(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = ?',
            [user.user_id]
        );

        // ส่งข้อมูลกลับไปยัง client
        res.json({
            success: true,
            message: 'Login successful',
            token,
            studentID: user.role === 'student' ? user.username : null,
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            role: user.role,
            isEligibleForInternship: user.isEligibleForInternship || false,
            isEligibleForProject: user.isEligibleForProject || false
        });
    } catch (error) {
        logger.error('Login error', {
            username,
            error: error.message,
            stack: error.stack,
            timestamp: new Date(),
            ip: req.ip
        });
        next(error);
    }
}