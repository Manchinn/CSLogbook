const express = require('express');
const router = express.Router();
const { getStudentPairs, updateProjectPairs } = require('../controllers/studentPairsController');
const { authenticateToken, checkRole, checkTeacherType } = require('../middleware/authMiddleware');

// เส้นทางสำหรับการดึงข้อมูลคู่โปรเจค
router.get('/', authenticateToken, checkRole(['admin', 'teacher']), checkTeacherType(['support']), getStudentPairs);

// เส้นทางสำหรับการอัปเดตข้อมูลคู่โปรเจค
router.put('/update', authenticateToken, checkRole(['admin', 'teacher']), checkTeacherType(['support']), updateProjectPairs);

module.exports = router;