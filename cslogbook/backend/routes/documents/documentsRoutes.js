const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticateToken, checkRole } = require('../../middleware/authMiddleware');
const documentController = require('../../controllers/documents/documentController');
require('../swagger/documents')

// Configure multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const type = req.body.documentType;
        cb(null, `uploads/documents/${type}/`);
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        cb(null, `${req.user.studentId}-${req.body.documentType}-${timestamp}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }
});

// Routes
router.get('/', authenticateToken, documentController.getDocuments);
router.get('/:id', documentController.getDocumentById);
router.get('/:id/history',  documentController.getDocumentHistory);
router.post('/submit', authenticateToken, upload.single('file'), documentController.submitDocument);
router.post('/:id/approve', documentController.approveDocument);
router.post('/:id/reject', documentController.rejectDocument);
router.patch('/:id/status', authenticateToken, checkRole(['admin', 'teacher']), documentController.updateStatus);

module.exports = router;
