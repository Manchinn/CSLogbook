const express = require('express');
const router = express.Router();
const { getStats } = require('../controllers/adminController');
const { authenticateToken, checkRole } = require('../middleware/authMiddleware');

router.get('/stats', authenticateToken, checkRole(['admin']), getStats);

module.exports = router;