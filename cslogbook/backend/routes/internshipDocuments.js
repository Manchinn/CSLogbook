const express = require('express');
const multer = require('multer');
const router = express.Router();
const internshipDocumentController = require('../controllers/internshipdocumentController');
const { authenticateToken, checkRole } = require('../middleware/authMiddleware');
require('./swagger/internshipDocuments');

const upload = multer({ dest: 'uploads/' });

router.post('/', authenticateToken, upload.single('document'), internshipDocumentController.submitInternshipDocuments);

router.get('/', authenticateToken, checkRole(['admin']), internshipDocumentController.getInternshipDocuments);

router.get('/:id', authenticateToken, checkRole(['admin']), internshipDocumentController.getInternshipDocumentById);

router.post('/:id/approve', authenticateToken, checkRole(['admin']), internshipDocumentController.approveInternshipDocument);

router.post('/:id/reject', authenticateToken, checkRole(['admin']), internshipDocumentController.rejectInternshipDocument);

module.exports = router;
