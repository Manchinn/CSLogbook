const express = require('express');
const router = express.Router();
const curriculumController = require('../controllers/curriculumController');
const { authenticateToken } = require('../middleware/authMiddleware');
const authorize = require('../middleware/authorize');

// ดึงหลักสูตรที่ใช้งานอยู่ (ต้องวางไว้ก่อน route ที่มี parameter /:id)
router.get('/active', curriculumController.getActiveCurriculum);

// ดึงข้อมูลหลักสูตรทั้งหมด
router.get('/', authenticateToken, authorize('curriculum', 'manage'), curriculumController.getCurriculums);

// ดึงข้อมูลหลักสูตรสำหรับ mapping (ต้องวางไว้ก่อน route ที่มี parameter /:id)
router.get('/mappings', authenticateToken, authorize('curriculum', 'manage'), curriculumController.getCurriculumMappings);

// ดึงข้อมูลหลักสูตรตาม ID
router.get('/:id', authenticateToken, authorize('curriculum', 'manage'), curriculumController.getCurriculumById);

// สร้างหลักสูตรใหม่
router.post('/', authenticateToken, authorize('curriculum', 'manage'), curriculumController.createCurriculum);

// อัปเดตข้อมูลหลักสูตร
router.put('/:id', authenticateToken, authorize('curriculum', 'manage'), curriculumController.updateCurriculum);

// ลบหลักสูตร
router.delete('/:id', authenticateToken, authorize('curriculum', 'manage'), curriculumController.deleteCurriculum);

module.exports = router;
