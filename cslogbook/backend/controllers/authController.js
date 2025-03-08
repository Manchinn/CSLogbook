const pool = require('../config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { sendLoginNotification } = require('../utils/mailer');
const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');
const moment = require('moment-timezone');

// Validation rules ยังคงเดิม
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
        const { username, password } = req.body;

        const [users] = await pool.execute(`
            SELECT u.*, 
                   s.student_code,
                   s.total_credits,
                   s.major_credits,
                   s.is_eligible_internship,
                   s.is_eligible_project,
                   t.teacher_code,
                   t.contact_extension,
                   a.admin_code
            FROM users u
            LEFT JOIN students s ON u.user_id = s.user_id AND u.role = 'student'
            LEFT JOIN teachers t ON u.user_id = t.user_id AND u.role = 'teacher'
            LEFT JOIN admins a ON u.user_id = a.user_id AND u.role = 'admin'
            WHERE u.username = ? AND u.active_status = true`,
            [username]
        );

        const user = users[0];

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
        }

        // แก้ token payload
        const token = jwt.sign(
            { 
                userId: user.user_id, 
                role: user.role
                // ลบ roleDetails ออก
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        // ส่งข้อมูลกลับ frontend
        res.json({
            success: true,
            token,
            userData: {
                userId: user.user_id,
                username: user.username,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role,
                studentCode: user.student_code,
                totalCredits: user.total_credits,
                majorCredits: user.major_credits,
                isEligibleForInternship: user.is_eligible_internship,
                isEligibleForProject: user.is_eligible_project
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' });
    }
};