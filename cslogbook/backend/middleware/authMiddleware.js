const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const validateEnv = require('../utils/validateEnv');

// Validate JWT environment variables
validateEnv('auth');

const authMiddleware = {
  authenticateToken: (req, res, next) => {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader?.split(' ')[1];

      if (!token) {
        return res.status(401).json({ 
          status: 'error',
          message: 'กรุณาเข้าสู่ระบบ',
          code: 'NO_TOKEN_PROVIDED'
        });
      }

      const user = jwt.verify(token, process.env.JWT_SECRET);
      req.user = user;
      next();
    } catch (err) {
      console.error('Authentication error:', err.message);
      return res.status(403).json({ 
        status: 'error',
        message: err.name === 'TokenExpiredError' ? 
          'Session หมดอายุ กรุณาเข้าสู่ระบบใหม่' : 
          'Token ไม่ถูกต้อง',
        code: err.name === 'TokenExpiredError' ? 
          'TOKEN_EXPIRED' : 
          'INVALID_TOKEN'
      });
    }
  },

  checkRole: (roles) => (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'กรุณาเข้าสู่ระบบ',
        code: 'NO_USER'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }
    next();
  },

  checkSelfOrAdmin: (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบ' });
    }

    if (req.user.role === 'admin' || req.user.studentID === req.params.id) {
      return next();
    }

    return res.status(403).json({ error: 'คุณไม่มีสิทธิ์แก้ไขข้อมูลนี้' });
  },

  async checkEligibility(type) {
    return async (req, res, next) => {
      if (!req.user?.studentID) {
        return res.status(401).json({
          status: 'error',
          message: 'ไม่พบข้อมูลนักศึกษา',
          code: 'NO_STUDENT_ID'
        });
      }

      try {
        const [students] = await pool.execute(`
          SELECT 
            u.*, 
            sd.totalCredits, 
            sd.majorCredits,
            SUBSTRING(u.studentID, 1, 2) as studentYear
          FROM users u
          LEFT JOIN student_data sd ON u.studentID = sd.studentID
          WHERE u.studentID = ?
        `, [req.user.studentID]);

        if (students.length === 0) {
          return res.status(404).json({
            status: 'error',
            message: 'ไม่พบข้อมูลนักศึกษา',
            code: 'STUDENT_NOT_FOUND'
          });
        }

        const student = students[0];
        
        const eligibilityChecks = {
          internship: {
            condition: +student.studentYear <= 63 && student.totalCredits >= 81,
            message: 'ต้องมีหน่วยกิตรวมไม่น้อยกว่า 81 หน่วยกิต'
          },
          project: {
            condition: +student.studentYear <= 62 && 
                      student.totalCredits >= 95 && 
                      student.majorCredits >= 47,
            message: 'ต้องมีหน่วยกิตรวมไม่น้อยกว่า 95 หน่วยกิต และหน่วยกิตวิชาเอกไม่น้อยกว่า 47 หน่วยกิต'
          }
        };

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