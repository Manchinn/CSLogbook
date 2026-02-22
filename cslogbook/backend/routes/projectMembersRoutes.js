const express = require('express');
const router = express.Router();
const { getProjectMembers, updateProjectMembers } = require('../controllers/projectMembersController');
const { authenticateToken } = require('../middleware/authMiddleware');
const authorize = require('../middleware/authorize');

// เส้นทางสำหรับการดึงข้อมูลคู่โปรเจค
router.get('/', authenticateToken, authorize('projectMembers', 'manage'), getProjectMembers);

// เส้นทางสำหรับการอัปเดตข้อมูลคู่โปรเจค
router.put('/update', authenticateToken, authorize('projectMembers', 'manage'), updateProjectMembers);

module.exports = router;
