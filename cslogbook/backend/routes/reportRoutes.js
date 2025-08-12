// routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const reportController = require('../controllers/reportController');

// รายงาน (Authentication บังคับ)
router.get('/overview', authenticateToken, reportController.getOverview);
router.get('/internships/logbook-compliance', authenticateToken, reportController.getInternshipLogbookCompliance);
router.get('/internships/student-summary', authenticateToken, reportController.getInternshipStudentSummary);
router.get('/internships/evaluations/summary', authenticateToken, reportController.getInternshipEvaluationSummary);
router.get('/projects/status-summary', authenticateToken, reportController.getProjectStatusSummary);
router.get('/projects/advisor-load', authenticateToken, reportController.getAdvisorLoad);

module.exports = router;
