const express = require('express');
const router = express.Router();
const { getStudentPairs, updateProjectPairs } = require('../controllers/studentPairsController');
const { authenticateToken } = require('../middleware/authMiddleware');
const authorize = require('../middleware/authorize');

// เส้นทางสำหรับการดึงข้อมูลคู่โปรเจค
router.get('/', authenticateToken, authorize('studentPairs', 'manage'), getStudentPairs);

// เส้นทางสำหรับการอัปเดตข้อมูลคู่โปรเจค
router.put('/update', authenticateToken, authorize('studentPairs', 'manage'), updateProjectPairs);

module.exports = router;
