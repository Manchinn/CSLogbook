const express = require('express');
const router = express.Router();
const projectWorkflowStateController = require('../controllers/projectWorkflowStateController');
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * Public/General Routes
 * (อาจจะต้อง authenticate ตามความต้องการ)
 */

// GET /api/projects/workflow-states/statistics - สถิติภาพรวม
router.get(
  '/statistics',
  authenticateToken,
  projectWorkflowStateController.getStatistics
);

// GET /api/projects/workflow-states/attention - โครงงานที่ต้องให้ความสนใจ
router.get(
  '/attention',
  authenticateToken,
  projectWorkflowStateController.getAttentionRequired
);

// GET /api/projects/workflow-states/filter - Filter โครงงาน
router.get(
  '/filter',
  authenticateToken,
  projectWorkflowStateController.getProjectsByFilter
);

/**
 * Admin Routes
 */

// GET /api/admin/dashboard/project-statistics - Dashboard สำหรับ admin
router.get(
  '/admin/statistics',
  authenticateToken,
  // TODO: เพิ่ม middleware checkRole(['admin', 'staff'])
  projectWorkflowStateController.getAdminDashboardStatistics
);

/**
 * Project-specific Routes
 * Mount ใน projectRoutes หรือเรียกผ่าน /api/projects/:projectId/workflow-state
 */

module.exports = router;
