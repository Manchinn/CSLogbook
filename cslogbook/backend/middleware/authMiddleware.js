const jwt = require('jsonwebtoken');
const { User, Student } = require('../models');
const validateEnv = require('../utils/validateEnv');
const { CONSTANTS } = require('../utils/studentUtils');
const authorize = require('./authorize');
const logger = require('../utils/logger');

// Validate JWT environment variables
validateEnv('auth');

const authMiddleware = {
  authenticateToken: async (req, res, next) => {
    try {
      // ดึง token จาก Authorization header
      const authHeader = req.headers['authorization'];
      const token = authHeader?.split(' ')[1];

      // ตรวจสอบว่ามี token หรือไม่
      if (!token) {
        return res.status(401).json({ 
          status: 'error',
          message: 'กรุณาเข้าสู่ระบบ',
          code: 'NO_TOKEN_PROVIDED'
        });
      }

      // ตรวจสอบความถูกต้องของ token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // ค้นหาผู้ใช้ในระบบ
      const user = await User.findOne({
        where: { 
          userId: decoded.userId,
          activeStatus: true 
        }
      });

      if (!user) {
        throw new Error('User not found or inactive');
      }

      // เพิ่มข้อมูล studentId หากเป็น role: student
      if (user.role === 'student') {
        const student = await Student.findOne({
          where: { userId: user.userId }
        });
        
        if (student) {
          // เพิ่มข้อมูล studentId เข้าไปใน token payload
          decoded.studentId = student.studentId;
        }
      }

      req.user = decoded;
      next();
    } catch (err) {
      logger.error('Authentication error:', err);
      return res.status(401).json({
        status: 'error',
        message: err.name === 'TokenExpiredError' ? 
            'Session หมดอายุ กรุณาเข้าสู่ระบบใหม่' : 
            'Token ไม่ถูกต้อง'
      });
    }
  },

  checkRole: (roles) => authorize.fromAllowed(roles),

  // Legacy wrapper: อนุญาตเฉพาะ teacher ตาม type ที่กำหนด
  checkTeacherType: (allowedTypes) =>
    authorize.fromAllowed((allowedTypes || []).map((type) => `teacher:${type}`)),

  // Legacy wrapper: อนุญาต admin หรือ teacher ตามตำแหน่งที่กำหนด
  checkTeacherPosition: (allowedPositions) =>
    authorize.fromAllowed([
      'admin',
      ...(allowedPositions || []).map((position) => `teacher:position:${position}`)
    ]),

  checkSelfOrAdmin: async (req, res, next) => {
    try {
      // ตรวจสอบการ authenticate
      if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      // ตรวจสอบสิทธิ์การเข้าถึงข้อมูลตนเองหรือ admin
      const userRole = req.user.role;
      const userStudentCode = req.user.studentCode;
      const requestedId = req.params.id;

      if (userRole === 'admin' || userStudentCode === requestedId) {
        next();
      } else {
        return res.status(403).json({
          message: 'Access denied',
          details: { userRole, userStudentCode, requestedId }
        });
      }
    } catch (error) {
      logger.error('Auth Middleware Error:', error);
      return res.status(500).json({ message: 'Internal server error in auth check' });
    }
  },

  async checkEligibility(type) {
    return async (req, res, next) => {
      // ตรวจสอบรหัสนักศึกษา
      if (!req.user?.studentCode) {
        return res.status(401).json({
          status: 'error',
          message: 'ไม่พบข้อมูลนักศึกษา',
          code: 'NO_STUDENT_ID'
        });
      }

      try {
        // ดึงข้อมูลนักศึกษา
        const student = await Student.findOne({
          where: { studentCode: req.user.studentCode },
          include: [{ model: User, required: true }]
        });

        // Import CONSTANTS

        // กำหนดเงื่อนไขการตรวจสอบสิทธิ์
        const eligibilityChecks = {
          internship: {
            condition: +student.User.studentId.substring(0, 2) >= 63 && student.totalCredits >= CONSTANTS.INTERNSHIP.MIN_TOTAL_CREDITS,
            message: `ต้องมีหน่วยกิตรวมไม่น้อยกว่า ${CONSTANTS.INTERNSHIP.MIN_TOTAL_CREDITS} หน่วยกิต`
          },
          project: {
            condition: +student.User.studentId.substring(0, 2) >= 62 &&
                      student.totalCredits >= CONSTANTS.PROJECT.MIN_TOTAL_CREDITS &&
                      student.majorCredits >= CONSTANTS.PROJECT.MIN_MAJOR_CREDITS,
            message: `ต้องมีหน่วยกิตรวมไม่น้อยกว่า ${CONSTANTS.PROJECT.MIN_TOTAL_CREDITS} หน่วยกิต และหน่วยกิตวิชาภาคไม่น้อยกว่า ${CONSTANTS.PROJECT.MIN_MAJOR_CREDITS} หน่วยกิต`
          }
        };

        // ตรวจสอบเงื่อนไข
        const check = eligibilityChecks[type];
        if (!check || !check.condition) { // Added a check for `check` itself to prevent errors if `type` is invalid
          return res.status(400).json({ // Changed to 400 for invalid type
            status: 'error',
            message: 'ประเภทการตรวจสอบสิทธิ์ไม่ถูกต้อง',
            code: 'INVALID_ELIGIBILITY_TYPE'
          });
        }

        if (!check.condition) {
          return res.status(403).json({
            status: 'error',
            message: `คุณยังไม่มีสิทธิ์เข้าถึงระบบ${type === 'internship' ? 'ฝึกงาน' : 'โปรเจค'}: ${check.message}`,
            code: `INSUFFICIENT_CREDITS_${type.toUpperCase()}`
          });
        }

        next();
      } catch (error) {
        logger.error('Eligibility check error:', error);
        return res.status(500).json({
          status: 'error',
          message: 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์',
          code: 'ELIGIBILITY_CHECK_ERROR'
        });
      }
    };
  }
};

module.exports = authMiddleware;
