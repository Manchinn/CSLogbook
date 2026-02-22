const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const authorize = require('../middleware/authorize');
const controller = require('../controllers/internshipCompanyStatsController');

// GET /api/internship/company-stats?academicYear=...&semester=...&limit=...
router.get('/company-stats', authenticateToken, authorize('internship', 'companyStats'), controller.getCompanyStats);
// GET /api/internship/company-stats/:companyName/detail
router.get('/company-stats/:companyName/detail', authenticateToken, authorize('internship', 'companyStats'), controller.getCompanyDetail);

module.exports = router;
