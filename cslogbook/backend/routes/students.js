const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { authenticateToken, checkRole,checkSelfOrAdmin } = require('../middleware/authMiddleware.js');

router.get('/', authenticateToken, checkRole(['admin', 'teacher']), studentController.getAllStudents);

router.get('/:id', authenticateToken, checkSelfOrAdmin, studentController.getStudentById);
router.put('/:id', authenticateToken, checkSelfOrAdmin, studentController.updateStudent);

router.delete('/:id', authenticateToken, checkRole(['admin']), studentController.deleteStudent);

router.post('/', authenticateToken, checkRole(['admin']), studentController.addStudent);

module.exports = router;