const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
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

// Admin routes
router.post('/', 
  checkRole(['admin']), 
  studentController.addStudent
);

router.get('/', 
  checkRole(['admin', 'teacher']),
  studentController.getAllStudents
);

router.get('/:id', 
  checkRole(['admin', 'teacher', 'student']),
  studentController.getStudentById
);

router.put('/:id',
  checkRole(['admin', 'student']),
  studentController.updateStudent
);

router.delete('/:id',
  checkRole(['admin']),
  studentController.deleteStudent
);

module.exports = router;