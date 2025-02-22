const express = require('express');
const multer = require('multer');
const router = express.Router();
const internshipDocumentController = require('../controllers/internshipDocumentController');
require('./swagger/internshipDocuments');

router.post('/', internshipDocumentController.submitInternshipDocuments);

router.get('/', internshipDocumentController.getInternshipDocuments);

router.get('/:id', internshipDocumentController.getInternshipDocumentById);

router.post('/:id/approve', internshipDocumentController.approveInternshipDocument);

router.post('/:id/reject', internshipDocumentController.rejectInternshipDocument);

module.exports = router;
