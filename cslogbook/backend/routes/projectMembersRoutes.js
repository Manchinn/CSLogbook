const express = require('express');
const router = express.Router();
const { getProjectMembers, updateProjectMembers } = require('../controllers/projectMembersController');
const { authenticateToken, checkRole, checkTeacherType } = require('../middleware/authMiddleware');

// เส้นทางสำหรับการดึงข้อมูลคู่โปรเจค
router.get('/', authenticateToken, checkRole(['admin', 'teacher']), checkTeacherType(['support']), getProjectMembers);

// เส้นทางสำหรับการอัปเดตข้อมูลคู่โปรเจค
router.put('/update', authenticateToken, checkRole(['admin', 'teacher']), checkTeacherType(['support']), updateProjectMembers);

module.exports = router;