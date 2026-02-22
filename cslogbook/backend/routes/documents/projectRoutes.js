const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/authMiddleware');
const authorize = require('../../middleware/authorize');
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
    authorize('documents', 'studentSubmit'),
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
    authorize('documents', 'staffReview'),
    statusController.updateStatus
);

router.post('/:id/approve',
    authenticateToken,
    authorize('documents', 'staffReview'),
    statusController.approveDocument
);

router.post('/:id/reject',
    authenticateToken,
    authorize('documents', 'staffReview'),
    statusController.rejectDocument
);

module.exports = router;
