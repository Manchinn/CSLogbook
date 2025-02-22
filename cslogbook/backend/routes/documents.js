const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
require('./swagger/documents')

router.get('/', documentController.getDocuments);

router.get('/:id', documentController.getDocumentById);

router.post('/:id/approve', documentController.approveDocument);

router.post('/:id/reject', documentController.rejectDocument);

module.exports = router;
