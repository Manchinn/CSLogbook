const express = require('express');
const multer = require('multer');
const router = express.Router();
const {submitInternshipDocuments,getInternshipDocuments,getInternshipDocumentById, approveInternshipDocument,rejectInternshipDocument,uploadInternshipDocument} = require('../controllers/internshipdocumentController');
const { authenticateToken, checkRole } = require('../middleware/authMiddleware');
require('./swagger/internshipDocuments');

const upload = multer({ dest: 'uploads/' });

router.post('/', authenticateToken, checkRole(['student']), submitInternshipDocuments);

router.post('/upload', authenticateToken, upload.single('file'), uploadInternshipDocument);

router.get('/', authenticateToken, checkRole(['admin']), getInternshipDocuments);

router.get('/:id', authenticateToken, checkRole(['admin']), getInternshipDocumentById);

router.post('/:id/approve', authenticateToken, checkRole(['admin']), approveInternshipDocument);

router.post('/:id/reject', authenticateToken, checkRole(['admin']),rejectInternshipDocument);

module.exports = router;
