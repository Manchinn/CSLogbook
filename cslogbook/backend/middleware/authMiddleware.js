const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const validateEnv = require('../utils/validateEnv');

// Validate JWT environment variables
validateEnv('auth');

const handleDatabaseError = (error, res) => {
  console.error('Database Error:', {
    code: error.code,
    errno: error.errno,
    sql: error.sql,
    sqlState: error.sqlState
  });

  // จัดการ error ตาม error code
  switch (error.code) {
    case 'PROTOCOL_CONNECTION_LOST':
      return res.status(503).json({
        status: 'error',
        message: 'การเชื่อมต่อฐานข้อมูลถูกตัด กรุณาลองใหม่อีกครั้ง',
        code: 'DB_CONNECTION_LOST'
      });
    
    case 'ER_CON_COUNT_ERROR':
      return res.status(503).json({
        status: 'error',
        message: 'ฐานข้อมูลมีการเชื่อมต่อมากเกินไป กรุณาลองใหม่ภายหลัง',
        code: 'DB_TOO_MANY_CONNECTIONS'
      });

    default:
      return res.status(500).json({
        status: 'error',
        message: 'เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล',
        code: 'DB_ERROR'
      });
  }
};

const authMiddleware = {
  authenticateToken: (req, res, next) => {
    try {
      // ตรวจสอบ token
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบ' });
      }

      // ตรวจสอบและถอดรหัส token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = {
        user_id: decoded.user_id,
        role: decoded.role,
      };
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

      let connection;
      try {
        connection = await pool.getConnection();
        
        const [students] = await connection.execute(`
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
        return handleDatabaseError(error, res);
      } finally {
        if (connection) {
          connection.release();
        }
      }
    };
  },

  checkEligibility: async (req, res, next) => {
    try {
      const [student] = await pool.execute(`
        SELECT is_eligible_internship, is_eligible_project
        FROM students 
        WHERE user_id = ?`,
        [req.user.userId]
      );

      if (!student[0]) {
        return res.status(403).json({ message: 'ไม่พบข้อมูลนักศึกษา' });
      }

      req.eligibility = {
        internship: student[0].is_eligible_internship,
        project: student[0].is_eligible_project
      };
      
      next();
    } catch (error) {
      res.status(500).json({ message: 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์' });
    }
  }
};

exports.checkRole = (roles) => {
    return async (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: 'ไม่มีสิทธิ์เข้าถึงส่วนนี้'
            });
        }
        next();
    };
};

module.exports = authMiddleware;