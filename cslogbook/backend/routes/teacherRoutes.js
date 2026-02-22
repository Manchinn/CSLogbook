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

// route สำหรับดึงข้อมูลอาจารย์ของผู้ใช้ที่ล็อกอินอยู่
router.get('/me/profile',
  authorize('teachers', 'selfProfile'),
  teacherController.getMyTeacherProfile
);

router.get('/user/:userId', 
  authorize('teachers', 'read'),
  teacherController.getTeacherByUserId
);

router.put('/:id',
  authorize('teachers', 'read'),
  teacherController.updateTeacher
);

// ลบอาจารย์: อนุญาต admin หรืออาจารย์ประเภท support
router.delete('/:id',
  authorize('teachers', 'manage'),
  teacherController.deleteTeacher
);

// Routes สำหรับอาจารย์สายวิชาการเท่านั้น
router.get('/academic/dashboard',
  authorize('teachers', 'academicOnly'),
  teacherController.getAcademicDashboard
);

router.post('/academic/evaluation',
  authorize('teachers', 'academicOnly'),
  teacherController.submitEvaluation
);

// Routes สำหรับเจ้าหน้าที่ภาควิชาเท่านั้น
router.get('/support/dashboard',
  authorize('teachers', 'supportOnly'),
  teacherController.getSupportDashboard
);

router.post('/support/announcement',
  authorize('teachers', 'supportOnly'),
  teacherController.createAnnouncement
);

// Routes ที่ทั้งสองประเภทเข้าถึงได้
router.get('/documents',
  authorize('teachers', 'teacherOnly'),
  teacherController.getDocuments
);

module.exports = router;
