const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const studentProjectController = require('../controllers/studentProjectController');
const { authenticateToken } = require('../middleware/authMiddleware');
const authorize = require('../middleware/authorize');
const importantDeadlineController = require('../controllers/importantDeadlineController');

// Public routes (ถ้ามี)

// Protected routes (require authentication)
router.use(authenticateToken);

// Student eligibility check route (สำหรับนักศึกษาตรวจสอบสิทธิ์ของตนเอง)
router.get('/check-eligibility', 
  authorize('students', 'selfService'),
  studentController.checkStudentEligibility
);

// Upcoming important deadlines (student view)
router.get('/important-deadlines/upcoming',
  authorize('students', 'selfService'),
  importantDeadlineController.getUpcomingForStudent
);
router.get('/important-deadlines',
  authorize('students', 'selfService'),
  importantDeadlineController.getAllForStudent
);

// Student project management routes
// ดูโครงงานของนักศึกษา
router.get('/projects',
  authorize('students', 'selfService'),
  studentProjectController.getMyProjects
);

// ดูรายละเอียดโครงงานเฉพาะ
router.get('/projects/:id',
  authorize('students', 'selfService'),
  studentProjectController.getProjectById
);

// แก้ไขข้อมูลโครงงาน
router.put('/projects/:id',
  authorize('students', 'selfService'),
  studentProjectController.updateProject
);

// เพิ่มสมาชิกในโครงงาน
router.post('/projects/:id/members',
  authorize('students', 'selfService'),
  studentProjectController.addMember
);

// เปิดใช้งานโครงงาน
router.put('/projects/:id/activate',
  authorize('students', 'selfService'),
  studentProjectController.activateProject
);

// Admin/Support Staff routes
// เพิ่มนักศึกษา: อนุญาต admin หรืออาจารย์ประเภท support
router.post('/', 
  authorize('students', 'manage'),
  studentController.addStudent
);

// ดูรายการนักศึกษา: อนุญาต admin หรืออาจารย์ประเภท support
router.get('/', 
  authorize('students', 'manage'),
  studentController.getAllStudents
);

// ดึงตัวเลือกตัวกรอง (วางไว้ก่อน /:id เพื่อไม่ให้ชนกัน)
router.get('/filter-options', 
  authorize('students', 'read'),
  studentController.getFilterOptions
);

router.get('/:id', 
  authorize('students', 'read'),
  studentController.getStudentById
);

// อัปเดตข้อมูลติดต่อ (เบอร์โทรและห้องเรียน) - นักศึกษาสามารถแก้ไขข้อมูลของตัวเองได้
router.put('/:id/contact-info',
  authorize('students', 'updateContact'),
  studentController.updateContactInfo
);

router.put('/:id',
  authorize('students', 'updateProfile'),
  studentController.updateStudent
);

router.delete('/:id',
  authorize('students', 'manage'),
  studentController.deleteStudent
);

module.exports = router;
