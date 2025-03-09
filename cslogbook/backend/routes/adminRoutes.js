const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, checkRole } = require('../middleware/authMiddleware');

// Middleware for admin routes
const adminAuth = [authenticateToken, checkRole(['admin'])];

// Main dashboard stats
router.get('/stats', adminAuth, async (req, res, next) => {
  console.log('Admin stats request received');
  try {
    await adminController.getStats(req, res);
  } catch (error) {
    console.error('Route error:', error);
    next(error);
  }
});

// Individual stats routes
router.get('/stats/students', adminAuth, adminController.getStudentStats);
router.get('/stats/documents', adminAuth, adminController.getDocumentStats);
router.get('/stats/system', adminAuth, adminController.getSystemStats);

module.exports = router;