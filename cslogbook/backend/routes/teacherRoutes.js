const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const { authenticateToken, checkRole } = require('../middleware/authMiddleware');

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

router.put('/:id',
  checkRole(['admin', 'teacher']),
  teacherController.updateTeacher
);

router.delete('/:id',
  checkRole(['admin']),
  teacherController.deleteTeacher
);

// Additional routes for teacher-specific functionality
router.get('/:id/advisees',
  checkRole(['admin', 'teacher']),
  teacherController.getAdvisees
);

module.exports = router;