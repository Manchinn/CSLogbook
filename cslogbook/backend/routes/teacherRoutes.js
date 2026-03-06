const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const importantDeadlineController = require('../controllers/importantDeadlineController');
const { authenticateToken } = require('../middleware/authMiddleware');
const authorize = require('../middleware/authorize');

// Protect all routes with authentication
router.use(authenticateToken);

// ดึงกำหนดการสำคัญที่เจ้าหน้าที่เผยแพร่ให้ทีมอาจารย์ที่ปรึกษา
router.get('/important-deadlines',
  authorize('teachers', 'academicOnly'),
  importantDeadlineController.getAllForTeacher
);

// ดึงข้อมูล dashboard สำหรับอาจารย์สายวิชาการ
router.get('/academic/dashboard',
  authorize('teachers', 'academicOnly'),
  teacherController.getAcademicDashboard
);

// รายชื่ออาจารย์ให้ student ใช้เลือกเป็นที่ปรึกษา (เปิด read-only)
router.get('/advisors',
  authorize('teachers', 'advisorList'),
  teacherController.getAdvisorList
);

// Admin routes
// เพิ่มอาจารย์: อนุญาต admin หรืออาจารย์ประเภท support
router.post('/', 
  authorize('teachers', 'manage'),
  teacherController.addTeacher
);

// ดูรายการอาจารย์ทั้งหมด: อนุญาต admin หรืออาจารย์ประเภท support
router.get('/', 
  authorize('teachers', 'manage'),
  teacherController.getAllTeachers
);

router.get('/meeting-approvals',
  authorize('teachers', 'academicOnly'),
  teacherController.getMeetingApprovalQueue
);

router.get('/:id',
  authorize('teachers', 'read'),
  teacherController.getTeacherById
);

module.exports = router;
