const express = require('express');
const router = express.Router();
const loginLimiter = require('../middleware/rateLimiter');
const authController = require('../controllers/authController');
const { login, refreshToken, logout } = require('../controllers/authController');
const { validateLogin } = require('../validators/authValidators');
const passwordController = require('../controllers/passwordController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Validate environment variables
if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required for authentication routes');
}

// Public routes
router.post('/login', loginLimiter, validateLogin, login);

// Protected routes
router.post('/refresh-token', authenticateToken, refreshToken);
router.post('/logout', authenticateToken, logout);

// Two-step mandatory endpoints (legacy endpoints ถูกลบแล้ว)
router.post('/password/change/init', authenticateToken, passwordController.initTwoStepChange);
router.post('/password/change/confirm', authenticateToken, passwordController.confirmTwoStepChange);

// Token verification route — ดึงข้อมูลจาก DB เพราะ JWT ไม่มี PII แล้ว
const { User, Student, Teacher, Admin } = require('../models');

router.get('/verify-token', authenticateToken, async (req, res) => {
    try {
        const user = await User.findOne({ where: { userId: req.user.userId, activeStatus: true } });
        if (!user) {
            return res.status(401).json({ valid: false, message: 'ไม่พบผู้ใช้ในระบบ' });
        }

        const base = {
            userId: user.userId,
            role: user.role,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
        };

        let roleFields = {};
        if (user.role === 'student') {
            const s = await Student.findOne({ where: { userId: user.userId } });
            roleFields = { studentId: s?.studentId, studentCode: s?.studentCode };
        } else if (user.role === 'teacher') {
            const t = await Teacher.findOne({ where: { userId: user.userId } });
            roleFields = {
                teacherId: t?.teacherId,
                teacherCode: t?.teacherCode,
                teacherType: t?.teacherType,
                teacherPosition: t?.position,
                canAccessTopicExam: Boolean(t?.canAccessTopicExam),
                canExportProject1: Boolean(t?.canExportProject1),
                isSystemAdmin: t?.teacherType === 'support',
            };
        } else if (user.role === 'admin') {
            const a = await Admin.findOne({ where: { userId: user.userId } });
            roleFields = { adminId: a?.adminId, isSystemAdmin: true };
        }

        res.json({ valid: true, user: { ...base, ...roleFields } });
    } catch (error) {
        res.status(500).json({ valid: false, message: 'เกิดข้อผิดพลาดในการตรวจสอบ token' });
    }
});



module.exports = router;
