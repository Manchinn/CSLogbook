const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const { authenticateToken, checkRole, checkTeacherType } = require('../middleware/authMiddleware');

// Protect all routes with authentication
router.use(authenticateToken);

// Admin routes
router.post('/', 
  checkRole(['admin']), 
  teacherController.addTeacher
);

router.get('/', 
  checkRole(['admin']), 
  teacherController.getAllTeachers
);

router.get('/:id', 
  checkRole(['admin', 'teacher']),
  teacherController.getTeacherById
);

// route สำหรับดึงข้อมูลอาจารย์ของผู้ใช้ที่ล็อกอินอยู่
router.get('/me/profile',
  checkRole(['teacher']),
  teacherController.getMyTeacherProfile
);

router.get('/user/:userId', 
  checkRole(['admin', 'teacher']),
  teacherController.getTeacherByUserId
);

router.put('/:id',
  checkRole(['admin', 'teacher']),
  teacherController.updateTeacher
);

// Routes สำหรับอาจารย์สายวิชาการเท่านั้น
router.get('/academic/dashboard',
  checkRole(['teacher']),
  checkTeacherType(['academic']),
  teacherController.getAcademicDashboard
);

router.post('/academic/evaluation',
  checkRole(['teacher']),
  checkTeacherType(['academic']),
  teacherController.submitEvaluation
);

// Routes สำหรับเจ้าหน้าที่ภาควิชาเท่านั้น
router.get('/support/dashboard',
  checkRole(['teacher']),
  checkTeacherType(['support']),
  teacherController.getSupportDashboard
);

router.post('/support/announcement',
  checkRole(['teacher']),
  checkTeacherType(['support']),
  teacherController.createAnnouncement
);

// Routes ที่ทั้งสองประเภทเข้าถึงได้
router.get('/documents',
  checkRole(['teacher']),
  teacherController.getDocuments
);

module.exports = router;