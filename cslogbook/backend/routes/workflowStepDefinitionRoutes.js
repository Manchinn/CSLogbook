const express = require('express');
const router = express.Router();
const workflowStepDefinitionController = require('../controllers/workflowStepDefinitionController');
const { authenticateToken, checkRole, checkTeacherType } = require('../middleware/authMiddleware');

// ดึงรายการขั้นตอนทั้งหมด (admin และ teacher support)
router.get('/', 
  authenticateToken, 
  checkRole(['admin', 'teacher']), 
  checkTeacherType(['support']),
  workflowStepDefinitionController.getAllSteps
);

// ดึงข้อมูลขั้นตอนเฉพาะ (admin และ teacher support)
router.get('/:stepId', 
  authenticateToken, 
  checkRole(['admin', 'teacher']), 
  checkTeacherType(['support']),
  workflowStepDefinitionController.getStepById
);

// ดูสถิติการใช้งานขั้นตอน (admin และ teacher support)
router.get('/:stepId/stats', 
  authenticateToken, 
  checkRole(['admin', 'teacher']), 
  checkTeacherType(['support']),
  workflowStepDefinitionController.getStepUsageStats
);

// สร้างขั้นตอนใหม่ (admin และ teacher support)
router.post('/', 
  authenticateToken, 
  checkRole(['admin', 'teacher']), 
  checkTeacherType(['support']),
  workflowStepDefinitionController.createStep
);

// จัดเรียงลำดับขั้นตอนใหม่ (admin และ teacher support)
router.post('/reorder', 
  authenticateToken, 
  checkRole(['admin', 'teacher']), 
  checkTeacherType(['support']),
  workflowStepDefinitionController.reorderSteps
);

// อัปเดตขั้นตอน (admin และ teacher support)
router.put('/:stepId', 
  authenticateToken, 
  checkRole(['admin', 'teacher']), 
  checkTeacherType(['support']),
  workflowStepDefinitionController.updateStep
);

// ลบขั้นตอน (admin และ teacher support)
router.delete('/:stepId', 
  authenticateToken, 
  checkRole(['admin', 'teacher']), 
  checkTeacherType(['support']),
  workflowStepDefinitionController.deleteStep
);

module.exports = router;