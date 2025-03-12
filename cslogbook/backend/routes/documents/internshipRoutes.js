const express = require('express');
const router = express.Router();
const { upload } = require('../../config/uploadConfig');
const internshipController = require('../../controllers/documents/internshipController');
const { authenticateToken, checkRole } = require('../../middleware/authMiddleware');

// CS-05 Routes
router.post('/cs-05/submit',
    authenticateToken,
    checkRole(['student']),
    internshipController.submitCS05
);

// Logbook Routes
router.post('/logbook/entry',
    authenticateToken,
    checkRole(['student']),
    internshipController.addLogbookEntry
);

router.get('/logbook',
    authenticateToken,
    internshipController.getLogbookEntries
);

// Document Upload Routes
router.post('/upload',
    authenticateToken,
    upload.single('file'),
    internshipController.uploadDocument
);

// Document Management Routes
router.get('/',
    authenticateToken,
    internshipController.getDocuments
);

router.get('/:id',
    authenticateToken,
    internshipController.getDocumentById
);

router.get('/:id/download',
    authenticateToken,
    internshipController.downloadDocument
);

// Admin Routes
router.patch('/:id/status',
    authenticateToken,
    checkRole(['admin', 'teacher']),
    internshipController.updateStatus
);

module.exports = router;
