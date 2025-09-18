const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const controller = require('../controllers/projectDocumentController');

// ต้อง auth ทั้งหมด
router.use(authenticateToken);

// สร้างโครงงาน (นักศึกษา)
router.post('/', controller.createProject);

// รายการของฉัน
router.get('/mine', controller.getMyProjects);

// รายละเอียดโครงงาน
router.get('/:id', controller.getProject);

// อัปเดต metadata (leader)
router.patch('/:id', controller.updateProject);

// เพิ่มสมาชิกคนที่สอง
router.post('/:id/members', controller.addMember);

// Promote -> in_progress
router.post('/:id/activate', controller.activateProject);

// Archive (admin)
router.post('/:id/archive', controller.archiveProject);

module.exports = router;
