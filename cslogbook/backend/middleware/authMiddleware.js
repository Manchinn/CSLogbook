const jwt = require('jsonwebtoken');
const { User, Student } = require('../models');
const validateEnv = require('../utils/validateEnv');

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

      req.user = decoded;
      next();
    } catch (err) {
      return res.status(401).json({
        status: 'error',
        message: err.name === 'TokenExpiredError' ? 
            'Session หมดอายุ กรุณาเข้าสู่ระบบใหม่' : 
            'Token ไม่ถูกต้อง'
      });
    }
  },

  checkRole: (roles) => (req, res, next) => {
    // ตรวจสอบว่ามีข้อมูลผู้ใช้หรือไม่
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'กรุณาเข้าสู่ระบบ',
        code: 'NO_USER'
      });
    }

    // ตรวจสอบสิทธิ์การเข้าถึง
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }
    next();
  },

  checkSelfOrAdmin: async (req, res, next) => {
    try {
      // เพิ่ม debug logging
      console.log('Auth Check:', {
        user: req.user,
        params: req.params,
        headers: req.headers
      });

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
      console.error('Auth Middleware Error:', error);
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

        // กำหนดเงื่อนไขการตรวจสอบสิทธิ์
        const eligibilityChecks = {
          internship: {
            condition: +studentYear >= 63 && student.totalCredits >= 81,
            message: 'ต้องมีหน่วยกิตรวมไม่น้อยกว่า 81 หน่วยกิต'
          },
          project: {
            condition: +studentYear >= 62 && 
                      student.totalCredits >= 95 && 
                      student.majorCredits >= 47,
            message: 'ต้องมีหน่วยกิตรวมไม่น้อยกว่า 95 หน่วยกิต และหน่วยกิตวิชาเอกไม่น้อยกว่า 47 หน่วยกิต'
          }
        };

        // ตรวจสอบเงื่อนไข
        const check = eligibilityChecks[type];
        if (!check.condition) {
          return res.status(403).json({
            status: 'error',
            message: `คุณยังไม่มีสิทธิ์เข้าถึงระบบ${type === 'internship' ? 'ฝึกงาน' : 'โปรเจค'}: ${check.message}`,
            code: `INSUFFICIENT_CREDITS_${type.toUpperCase()}`
          });
        }

        next();
      } catch (error) {
        console.error('Eligibility check error:', error);
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