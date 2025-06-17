const express = require('express');
const router = express.Router();
const documentController = require('../../controllers/documents/documentController');

// Import document type routes
const projectRoutes = require('./projectRoutes');
const internshipRoutes = require('./internshipRoutes');
const logbookRoutes = require('./logbookRoutes');

// Document type routes with prefixes
router.use('/project', projectRoutes);
router.use('/internship', internshipRoutes);
router.use('/logbook', logbookRoutes);

// Common document routes
router.get('/search', documentController.searchDocuments);
router.get('/recent', documentController.getRecentDocuments);

module.exports = router;