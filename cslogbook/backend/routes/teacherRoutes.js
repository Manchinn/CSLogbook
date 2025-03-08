const express = require('express');
const router = express.Router();
const { getAllTeachers, addTeacher, updateTeacher, deleteTeacher } = require('../controllers/teacherController');
const { authenticateToken, checkRole } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, checkRole(['admin']), getAllTeachers);
router.post('/', authenticateToken, checkRole(['admin']), addTeacher);
// แก้จาก :sName เป็น :userId
router.put('/:userId', authenticateToken, checkRole(['admin']), updateTeacher);
router.delete('/:userId', authenticateToken, checkRole(['admin']), deleteTeacher);

module.exports = router;