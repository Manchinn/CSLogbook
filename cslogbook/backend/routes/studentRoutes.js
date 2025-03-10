const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { authenticateToken, checkRole } = require('../middleware/authMiddleware');

// Public routes
router.get('/:id', studentController.getStudentById);

// Protected routes (require authentication)
router.use(authenticateToken);

router.get('/', 
  authenticateToken,
  checkRole(['admin']),
  studentController.getAllStudents
);

// เพิ่ม route สำหรับดึงตัวเลือกการกรอง
router.get('/filter-options', authenticateToken, studentController.getAcademicFilterOptions);


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

module.exports = router;