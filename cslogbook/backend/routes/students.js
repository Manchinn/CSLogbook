const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, checkRole } = require('../middleware/authMiddleware.js');

// students.js (route)
router.get('/', authenticateToken, checkRole(['admin', 'teacher']), async (req, res, next) => {
  try {
    // เพิ่ม log เพื่อตรวจสอบ user
    console.log('User accessing student list:', req.user);

    const [students] = await pool.execute(`
      SELECT u.*, sd.isEligibleForInternship, sd.isEligibleForProject 
      FROM users u 
      LEFT JOIN student_data sd ON u.studentID = sd.studentID 
      WHERE u.role = 'student'
    `);

    // เพิ่ม log ข้อมูลที่จะส่งกลับ
    console.log('Sending student data, count:', students.length);

    res.json(students);
  } catch (error) {
    console.error('Error in student list route:', error);
    next(error);
  }
});

// routes/students.js
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    console.log('Requesting student data:', {
      requestedId: req.params.id,
      userId: req.user.studentID,
      userRole: req.user.role
    });

    // อนุญาตให้ admin และเจ้าของข้อมูลเข้าถึงได้
    if (req.user.role === 'admin' || req.user.studentID === req.params.id) {
      const [student] = await pool.execute(`
        SELECT u.*, sd.isEligibleForInternship, sd.isEligibleForProject 
        FROM users u 
        LEFT JOIN student_data sd ON u.studentID = sd.studentID 
        WHERE u.studentID = ?
      `, [req.params.id]);

      if (!student[0]) {
        return res.status(404).json({ error: 'ไม่พบข้อมูลนักศึกษา' });
      }
      res.json(student[0]);
    } else {
      res.status(403).json({ error: 'ไม่มีสิทธิ์เข้าถึงข้อมูล' });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
