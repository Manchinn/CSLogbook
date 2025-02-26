const express = require('express');
const router = express.Router();
const { getAllTeachers, addTeacher, updateTeacher, deleteTeacher } = require('../controllers/teacherController');
const { authenticateToken, checkRole } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, checkRole(['admin']), getAllTeachers);
router.post('/', authenticateToken, checkRole(['admin']), addTeacher);
router.put('/:sName', authenticateToken, checkRole(['admin']), updateTeacher);
router.delete('/:sName', authenticateToken, checkRole(['admin']), deleteTeacher);

module.exports = router;