const express = require('express');
const { uploadCSV, getUploadHistory } = require('../controllers/uploadController');
const { authenticateToken } = require('../middleware/authMiddleware');
const authorize = require('../middleware/authorize');
const { csvUpload } = require('../config/uploadConfig');

const router = express.Router();

router.post(
	'/upload-csv',
	authenticateToken,
	authorize('upload', 'csvManage'),
	csvUpload.single('file'),
	uploadCSV
);

router.get(
	'/upload-csv/history',
	authenticateToken,
	authorize('upload', 'csvManage'),
	getUploadHistory
);

module.exports = router;
