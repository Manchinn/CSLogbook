const express = require('express');
const router = express.Router();
const { upload } = require('../../config/uploadConfig');
const projectDocController = require('../controllers/projectDocumentController');
const { authenticateToken, checkRole } = require('../../middleware/authMiddleware');

// CS-02 Routes (แบบฟอร์มขอสอบ)
router.post('/cs-02/submit',
    authenticateToken,
    checkRole(['student']),
    projectDocController.submitCS02
);

// CS-04 Routes (หนังสือรับรองการทดสอบ)
router.post('/cs-04/submit',
    authenticateToken,
    checkRole(['student']),
    projectDocController.submitCS04
);

// Logbook Routes
router.post('/logbook/entry',
    authenticateToken,
    checkRole(['student']),
    projectDocController.addLogbookEntry
);

router.get('/logbook',
    authenticateToken,
    projectDocController.getLogbookEntries
);

// Common Document Routes
router.post('/upload',
    authenticateToken,
    upload.single('file'),
    projectDocController.uploadDocument
);

router.get('/',
    authenticateToken,
    projectDocController.getDocuments
);

router.get('/:id',
    authenticateToken,
    projectDocController.getDocumentById
);

router.get('/:id/download',
    authenticateToken,
    projectDocController.downloadDocument
);

// Admin/Teacher Routes
router.patch('/:id/status',
    authenticateToken,
    checkRole(['admin', 'teacher']),
    projectDocController.updateStatus
);

router.post('/:id/approve',
    authenticateToken,
    checkRole(['admin', 'teacher']),
    projectDocController.approveDocument
);

router.post('/:id/reject',
    authenticateToken,
    checkRole(['admin', 'teacher']),
    projectDocController.rejectDocument
);

module.exports = router;