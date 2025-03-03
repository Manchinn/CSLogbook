const express = require('express');
const multer = require('multer');
const { uploadCSV } = require('../controllers/uploadController');
const { authenticateToken, checkRole } = require('../middleware/authMiddleware');

const upload = multer({ dest: 'uploads/' });
const router = express.Router();

router.post('/upload-csv', authenticateToken, checkRole(['admin']), upload.single('file'), uploadCSV);

module.exports = router;
