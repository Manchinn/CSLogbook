// backend/routes/logbookRoutes.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const logbookController = require('../controllers/logbookController');

// Get user's logbooks
router.get('/', authenticateToken, logbookController.getLogbooks);

// Create new logbook
router.post('/', authenticateToken, logbookController.createLogbook);

// Update logbook
router.put('/:id', authenticateToken, logbookController.updateLogbook);

// Update logbook status
router.patch('/:id/status', authenticateToken, logbookController.updateLogbookStatus);

// Delete logbook
router.delete('/:id', authenticateToken, logbookController.deleteLogbook);

module.exports = router;