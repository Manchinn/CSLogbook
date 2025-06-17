const express = require('express');
const router = express.Router();
const workflowStepDefinitionController = require('../controllers/workflowStepDefinitionController');
const { authenticateToken, checkRole } = require('../middleware/authMiddleware');

// ดึงรายการขั้นตอนทั้งหมด (admin only)
router.get('/', 
  authenticateToken, 
  checkRole(['admin']), 
  workflowStepDefinitionController.getAllSteps
);

// ดึงข้อมูลขั้นตอนเฉพาะ (admin only)
router.get('/:stepId', 
  authenticateToken, 
  checkRole(['admin']), 
  workflowStepDefinitionController.getStepById
);

// ดูสถิติการใช้งานขั้นตอน (admin only)
router.get('/:stepId/stats', 
  authenticateToken, 
  checkRole(['admin']), 
  workflowStepDefinitionController.getStepUsageStats
);

// สร้างขั้นตอนใหม่ (admin only)
router.post('/', 
  authenticateToken, 
  checkRole(['admin']), 
  workflowStepDefinitionController.createStep
);

// จัดเรียงลำดับขั้นตอนใหม่ (admin only)
router.post('/reorder', 
  authenticateToken, 
  checkRole(['admin']), 
  workflowStepDefinitionController.reorderSteps
);

// อัปเดตขั้นตอน (admin only)
router.put('/:stepId', 
  authenticateToken, 
  checkRole(['admin']), 
  workflowStepDefinitionController.updateStep
);

// ลบขั้นตอน (admin only)
router.delete('/:stepId', 
  authenticateToken, 
  checkRole(['admin']), 
  workflowStepDefinitionController.deleteStep
);

module.exports = router;