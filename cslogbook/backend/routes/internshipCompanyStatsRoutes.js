const express = require('express');
const router = express.Router();
const { authenticateToken, checkRole } = require('../middleware/authMiddleware');
const controller = require('../controllers/internshipCompanyStatsController');

// GET /api/internship/company-stats?academicYear=...&semester=...&limit=...
router.get('/company-stats', authenticateToken, checkRole(['student','teacher','admin']), controller.getCompanyStats);
// GET /api/internship/company-stats/:companyName/detail
router.get('/company-stats/:companyName/detail', authenticateToken, checkRole(['student','teacher','admin']), controller.getCompanyDetail);

module.exports = router;
