const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { authenticateToken, checkRole } = require('../middleware/authMiddleware.js');

router.get('/', authenticateToken, checkRole(['admin', 'teacher']), studentController.getAllStudents);
router.get('/:id', authenticateToken, studentController.getStudentById);
router.put('/:id', authenticateToken, checkRole(['admin']), studentController.updateStudent);
router.delete('/:id', authenticateToken, checkRole(['admin']), studentController.deleteStudent);
router.post('/', authenticateToken, checkRole(['admin']), studentController.addStudent);

module.exports = router;
