const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { authenticateToken, checkRole } = require('../middleware/authMiddleware');

// Public routes (ถ้ามี)

// Protected routes (require authentication)
router.use(authenticateToken);

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