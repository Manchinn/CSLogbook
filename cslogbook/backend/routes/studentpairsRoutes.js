const express = require('express');
const router = express.Router();
const { getStudentPairs, updateProjectPairs } = require('../controllers/studentPairsController');
const { authenticateToken, checkRole } = require('../middleware/authMiddleware');

// เส้นทางสำหรับการดึงข้อมูลคู่โปรเจค
router.get('/', authenticateToken, checkRole(['admin']), getStudentPairs);

// เส้นทางสำหรับการอัปเดตข้อมูลคู่โปรเจค
router.put('/update', authenticateToken, checkRole(['admin']), updateProjectPairs);

module.exports = router;