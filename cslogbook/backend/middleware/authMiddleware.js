const jwt = require('jsonwebtoken');

const authMiddleware = {
  // ตรวจสอบ token
  authenticateToken: (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบ' });
    }

    try {
      const user = jwt.verify(token, process.env.JWT_SECRET);
      req.user = user;
      next();
    } catch (err) {
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
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบ' });
      }

      const student = mockStudentData.find(s => s.studentID === req.user.studentID);
      if (!student) {
        return res.status(404).json({ error: 'ไม่พบข้อมูลนักศึกษา' });
      }

      if (type === 'internship' && !student.isEligibleForInternship) {
        return res.status(403).json({ error: 'คุณยังไม่มีสิทธิ์เข้าถึงระบบฝึกงาน' });
      }

      if (type === 'project' && !student.isEligibleForProject) {
        return res.status(403).json({ error: 'คุณยังไม่มีสิทธิ์เข้าถึงระบบโปรเจค' });
      }

      next();
    };
  }
};

module.exports = authMiddleware;