const { User, Student, Admin, Teacher } = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { sendLoginNotification } = require('../utils/mailer');
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

        const { username, password } = req.body;

        // Find user with better error handling
        const user = await User.findOne({
            where: { username, activeStatus: true }
        }).catch(err => {
            console.error('Database query error:', err);
            throw new Error('Database connection error');
        });

        if (!user) {
            logger.warn(`Failed login attempt for username: ${username}`);
            return res.status(401).json({
                success: false,
                message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'
            });
        }

        // Verify password
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            logger.warn(`Invalid password for user: ${username}`);
            return res.status(401).json({
                success: false,
                message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'
            });
        }

        // Get role-specific data
        let roleData = {};
        switch (user.role) {
            case 'student':
                const studentData = await Student.findOne({
                    where: { userId: user.userId },
                    attributes: ['studentCode','totalCredits', 'majorCredits', 'isEligibleInternship', 'isEligibleProject']
                });
                roleData = {
                    studentCode: studentData.studentCode,
                    totalCredits: studentData?.totalCredits || 0,
                    majorCredits: studentData?.majorCredits || 0,
                    isEligibleForInternship: studentData?.isEligibleInternship || false,
                    isEligibleForProject: studentData?.isEligibleProject || false
                };
                break;

            case 'admin':
                const adminData = await Admin.findOne({
                    where: { userId: user.userId },
                    attributes: [
                        'adminId',
                        'adminCode',
                        'responsibilities',
                        'contactExtension'
                    ]
                });
                roleData = {
                    adminId: adminData?.adminId,
                    adminCode: adminData?.adminCode,
                    responsibilities: adminData?.responsibilities || 'System Administrator',
                    contactExtension: adminData?.contactExtension,
                    isSystemAdmin: true
                };
                break;

            case 'teacher':
                const teacherData = await Teacher.findOne({
                    where: { userId: user.userId },
                    attributes: ['department', 'position']
                });
                roleData = {
                    department: teacherData?.department,
                    position: teacherData?.position,
                    isAdvisor: true
                };
                break;
        }

        // Generate token with role-specific claims
        const token = jwt.sign(
            { 
                userId: user.userId, 
                role: user.role,
                studentID: user.studentID,
                isSystemAdmin: user.role === 'admin',
                department: roleData.department
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        // Update last login
        await User.update(
            { lastLogin: moment().tz('Asia/Bangkok').format() },
            { where: { userId: user.userId } }
        );

        // Send login notification if enabled
        if (process.env.EMAIL_LOGIN_ENABLED === 'true') {
            await sendLoginNotification(user.email, {
                firstName: user.firstName,
                time: moment().tz('Asia/Bangkok').format('LLLL')
            }).catch(error => {
                logger.error('Failed to send login notification:', error);
            });
        }

        // Log successful login
        logger.info('User logged in successfully', {
            userId: user.userId,
            role: user.role,
            timestamp: moment().tz('Asia/Bangkok').format()
        });

        // Send response
        res.json({
            success: true,
            token,
            userId: user.userId,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            ...roleData
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
        const user = await User.findOne({
            where: { userId: req.user.userId }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const token = jwt.sign({
            userId: user.userId,
            role: user.role
        }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN
        });

        res.json({
            success: true,
            token
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Logout handler
exports.logout = async (req, res) => {
    // Add logout logic here if needed
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
};