const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController.js');
const { authenticateToken, checkRole } = require('../middleware/authMiddleware.js');

/**
 * Student Routes Configuration
 * กำหนดเส้นทางสำหรับจัดการข้อมูลนักศึกษา
 * - ใช้ authenticateToken สำหรับตรวจสอบการเข้าสู่ระบบ
 * - ใช้ checkRole สำหรับตรวจสอบสิทธิ์การเข้าถึง
 */

// [GET] /api/students/stats
// ดึงข้อมูลสถิตินักศึกษาทั้งหมด (สำหรับ admin และ teacher)
router.get('/stats', 
  authenticateToken, 
  checkRole(['admin', 'teacher']), 
  studentController.getAllStudentStats
);

// [GET] /api/students/:id
// ดึงข้อมูลนักศึกษารายบุคคล (ทุก role สามารถเข้าถึงได้)
router.get('/:id', 
  authenticateToken, 
  checkRole(['admin', 'teacher', 'student']), 
  studentController.getStudentById
);

// [PUT] /api/students/:id
// อัพเดทข้อมูลนักศึกษา (admin และ teacher เท่านั้น)
router.put('/:id', 
  authenticateToken, 
  checkRole(['admin', 'teacher']), 
  studentController.updateStudent
);

// [DELETE] /api/students/:id
// ลบข้อมูลนักศึกษา (admin เท่านั้น)
router.delete('/:id', 
  authenticateToken, 
  checkRole(['admin']), 
  studentController.deleteStudent
);

// [POST] /api/students
// เพิ่มข้อมูลนักศึกษา (admin เท่านั้น)
router.post('/', 
  authenticateToken, 
  checkRole(['admin']), 
  studentController.addStudent
);

module.exports = router;