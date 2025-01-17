const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const authMiddleware = {
  // ตรวจสอบ token
  authenticateToken: (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบ' });
    }

    try {
      // แก้ไขตรงนี้ เอา decoded ออกเพราะไม่ได้ประกาศ
      const user = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Authenticated user:', {
        userId: user.userId,
        role: user.role,
        studentID: user.studentID
      });
      req.user = user;
      // เพิ่ม log เพื่อดู user info
      next();
    } catch (err) {
      console.error('Token verification error:', err);
      return res.status(403).json({ error: 'Token ไม่ถูกต้องหรือหมดอายุ' });
    }
  },

  // ตรวจสอบ role
  checkRole: (roles) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบ' });
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้' });
      }
      next();
    };
  },

  // ตรวจสอบสิทธิ์การฝึกงานและโปรเจค
  checkEligibility: (type) => {
    return async (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบ' });
      }

      try {
        // ดึงข้อมูลสิทธิ์จากฐานข้อมูล
        const [students] = await pool.execute(`
          SELECT u.*, sd.isEligibleForInternship, sd.isEligibleForProject
          FROM users u
          LEFT JOIN student_data sd ON u.studentID = sd.studentID
          WHERE u.studentID = ?
        `, [req.user.studentID]);

        if (students.length === 0) {
          return res.status(404).json({ error: 'ไม่พบข้อมูลนักศึกษา' });
        }

        const student = students[0];

        if (type === 'internship' && !student.isEligibleForInternship) {
          return res.status(403).json({ error: 'คุณยังไม่มีสิทธิ์เข้าถึงระบบฝึกงาน' });
        }

        if (type === 'project' && !student.isEligibleForProject) {
          return res.status(403).json({ error: 'คุณยังไม่มีสิทธิ์เข้าถึงระบบโปรเจค' });
        }

        next();
      } catch (error) {
        console.error('Error checking eligibility:', error);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์' });
      }
    };
  }
};

module.exports = authMiddleware;