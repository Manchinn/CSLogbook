const express = require('express');
const { uploadCSV } = require('../controllers/uploadController');
const { authenticateToken, checkRole, checkTeacherType } = require('../middleware/authMiddleware');
const { csvUpload } = require('../config/uploadConfig');

const router = express.Router();

router.post(
	'/upload-csv',
	authenticateToken,
	checkRole(['admin', 'teacher']),
	checkTeacherType(['support']),
	csvUpload.single('file'),
	uploadCSV
);

module.exports = router;
