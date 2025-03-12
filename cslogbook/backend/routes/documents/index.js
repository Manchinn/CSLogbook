const express = require('express');
const router = express.Router();

// Import document type routes
const projectRoutes = require('./projectRoutes');
const internshipRoutes = require('./internshipRoutes');
const logbookRoutes = require('./logbookRoutes');

// Document type routes with prefixes
router.use('/project', projectRoutes);        // จะเข้าถึงที่ /api/documents/project/...
router.use('/internship', internshipRoutes);  // จะเข้าถึงที่ /api/documents/internship/...
router.use('/logbook', logbookRoutes);        // จะเข้าถึงที่ /api/documents/logbook/...

// Common document routes
router.get('/search', documentController.searchDocuments);
router.get('/recent', documentController.getRecentDocuments);

module.exports = router;