const express = require('express');
const router = express.Router();
const { authenticateToken, checkRole } = require('../../middleware/authMiddleware');
const { upload } = require('../../config/uploadConfig');
const projectController = require('../../controllers/documents/projectController');
const statusController = require('../../controllers/documents/statusController');

// Project Document Routes
router.get('/', 
    authenticateToken, 
    projectController.getAllDocuments
);

router.post('/submit',
    authenticateToken,
    checkRole(['student']),
    upload.single('file'),
    projectController.submitDocument
);

router.get('/:id',
    authenticateToken,
    projectController.getDocumentById
);

// Status Management Routes
router.patch('/:id/status',
    authenticateToken,
    checkRole(['admin', 'teacher']),
    statusController.updateStatus
);

router.post('/:id/approve',
    authenticateToken,
    checkRole(['admin', 'teacher']),
    statusController.approveDocument
);

router.post('/:id/reject',
    authenticateToken,
    checkRole(['admin', 'teacher']),
    statusController.rejectDocument
);

module.exports = router;
