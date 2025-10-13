const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const studentProjectController = require('../controllers/studentProjectController');
const { authenticateToken, checkRole } = require('../middleware/authMiddleware');
const importantDeadlineController = require('../controllers/importantDeadlineController');

// Public routes (ถ้ามี)

// Protected routes (require authentication)
router.use(authenticateToken);

// Student eligibility check route (สำหรับนักศึกษาตรวจสอบสิทธิ์ของตนเอง)
router.get('/check-eligibility', 
  checkRole(['student']), 
  studentController.checkStudentEligibility
);

// Upcoming important deadlines (student view)
router.get('/important-deadlines/upcoming',
  checkRole(['student']),
  importantDeadlineController.getUpcomingForStudent
);
router.get('/important-deadlines',
  checkRole(['student']),
  importantDeadlineController.getAllForStudent
);

// Student project management routes
// ดูโครงงานของนักศึกษา
router.get('/projects',
  checkRole(['student']),
  studentProjectController.getMyProjects
);

// ดูรายละเอียดโครงงานเฉพาะ
router.get('/projects/:id',
  checkRole(['student']),
  studentProjectController.getProjectById
);

// แก้ไขข้อมูลโครงงาน
router.put('/projects/:id',
  checkRole(['student']),
  studentProjectController.updateProject
);

// เพิ่มสมาชิกในโครงงาน
router.post('/projects/:id/members',
  checkRole(['student']),
  studentProjectController.addMember
);

// เปิดใช้งานโครงงาน
router.put('/projects/:id/activate',
  checkRole(['student']),
  studentProjectController.activateProject
);

// Admin/Support Staff routes
// เพิ่มนักศึกษา: อนุญาต admin หรืออาจารย์ประเภท support
router.post('/', 
  checkRole(['admin', 'teacher']),
  require('../middleware/authMiddleware').checkTeacherType(['support']),
  studentController.addStudent
);

// ดูรายการนักศึกษา: อนุญาต admin หรืออาจารย์ประเภท support
router.get('/', 
  checkRole(['admin', 'teacher']),
  require('../middleware/authMiddleware').checkTeacherType(['support']),
  studentController.getAllStudents
);

router.get('/:id', 
  checkRole(['admin', 'teacher', 'student']),
  studentController.getStudentById
);

router.put('/:id',
  checkRole(['admin', 'student', 'teacher']),
  // ถ้าเป็นครู ให้ตรวจสอบว่าเป็นประเภท support เท่านั้น; ถ้าเป็น admin/student ให้ข้ามได้
  (req, res, next) => {
    if (req.user?.role === 'teacher') {
      return require('../middleware/authMiddleware').checkTeacherType(['support'])(req, res, next);
    }
    return next();
  },
  studentController.updateStudent
);

router.delete('/:id',
  checkRole(['admin', 'teacher']),
  require('../middleware/authMiddleware').checkTeacherType(['support']),
  studentController.deleteStudent
);

module.exports = router;