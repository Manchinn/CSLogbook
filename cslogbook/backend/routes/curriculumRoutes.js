const express = require('express');
const router = express.Router();
const curriculumController = require('../controllers/curriculumController');
const { authenticateToken, checkRole } = require('../middleware/authMiddleware');

// ดึงหลักสูตรที่ใช้งานอยู่ (ต้องวางไว้ก่อน route ที่มี parameter /:id)
router.get('/active', curriculumController.getActiveCurriculum);

// ดึงข้อมูลหลักสูตรทั้งหมด
router.get('/', authenticateToken, checkRole(['admin']), curriculumController.getCurriculums);

// ดึงข้อมูลหลักสูตรตาม ID
router.get('/:id', authenticateToken, checkRole(['admin']), curriculumController.getCurriculumById);

// สร้างหลักสูตรใหม่
router.post('/', authenticateToken, checkRole(['admin']), curriculumController.createCurriculum);

// อัปเดตข้อมูลหลักสูตร
router.put('/:id', authenticateToken, checkRole(['admin']), curriculumController.updateCurriculum);

// ลบหลักสูตร
router.delete('/:id', authenticateToken, checkRole(['admin']), curriculumController.deleteCurriculum);

module.exports = router;