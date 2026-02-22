const express = require('express');
const router = express.Router();
const workflowStepDefinitionController = require('../controllers/workflowStepDefinitionController');
const { authenticateToken } = require('../middleware/authMiddleware');
const authorize = require('../middleware/authorize');

// ดึงรายการขั้นตอนทั้งหมด (admin และ teacher support)
router.get('/', 
  authenticateToken, 
  authorize('workflowStepDefinition', 'manage'),
  workflowStepDefinitionController.getAllSteps
);

// ดึงข้อมูลขั้นตอนเฉพาะ (admin และ teacher support)
router.get('/:stepId', 
  authenticateToken, 
  authorize('workflowStepDefinition', 'manage'),
  workflowStepDefinitionController.getStepById
);

// ดูสถิติการใช้งานขั้นตอน (admin และ teacher support)
router.get('/:stepId/stats', 
  authenticateToken, 
  authorize('workflowStepDefinition', 'manage'),
  workflowStepDefinitionController.getStepUsageStats
);

// สร้างขั้นตอนใหม่ (admin และ teacher support)
router.post('/', 
  authenticateToken, 
  authorize('workflowStepDefinition', 'manage'),
  workflowStepDefinitionController.createStep
);

// จัดเรียงลำดับขั้นตอนใหม่ (admin และ teacher support)
router.post('/reorder', 
  authenticateToken, 
  authorize('workflowStepDefinition', 'manage'),
  workflowStepDefinitionController.reorderSteps
);

// อัปเดตขั้นตอน (admin และ teacher support)
router.put('/:stepId', 
  authenticateToken, 
  authorize('workflowStepDefinition', 'manage'),
  workflowStepDefinitionController.updateStep
);

// ลบขั้นตอน (admin และ teacher support)
router.delete('/:stepId', 
  authenticateToken, 
  authorize('workflowStepDefinition', 'manage'),
  workflowStepDefinitionController.deleteStep
);

module.exports = router;
