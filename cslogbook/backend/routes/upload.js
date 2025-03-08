const express = require('express');
const multer = require('multer');
const { uploadCSV, getUploadHistory } = require('../controllers/uploadController');
const { authenticateToken, checkRole } = require('../middleware/authMiddleware');

const upload = multer({ dest: 'uploads/' });
const router = express.Router();

router.post('/upload-csv', authenticateToken, checkRole(['admin']), upload.single('file'), uploadCSV);

router.get('/history', authenticateToken, checkRole(['admin']), getUploadHistory);

module.exports = router;
