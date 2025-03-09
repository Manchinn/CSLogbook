const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { authenticateToken, checkRole } = require('../middleware/authMiddleware');

// Public routes
router.get('/', studentController.getAllStudents);
router.get('/:id', studentController.getStudentById);

// Protected routes (require authentication)
router.use(authenticateToken);

// ตรวจสอบสิทธิ์นักศึกษา
router.get('/:id/eligibility', authenticateToken, studentController.getStudentById);

// Admin routes
router.post('/',
  checkRole(['admin']),
  studentController.addStudent
);

router.put('/:id',
  checkRole(['admin', 'teacher']),
  studentController.updateStudent
);

router.delete('/:id',
  checkRole(['admin']),
  studentController.deleteStudent
);

router.get('/stats/all',
  checkRole(['admin']),
  studentController.getAllStudentStats
);

module.exports = router;