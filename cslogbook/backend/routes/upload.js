const express = require('express');
const { uploadCSV, getUploadHistory } = require('../controllers/uploadController');
const { authenticateToken, checkRole, checkTeacherType } = require('../middleware/authMiddleware');
const { csvUpload } = require('../config/uploadConfig');

const router = express.Router();

const ensureSupportTeacher = checkTeacherType(['support']);

const allowAdminOrSupport = async (req, res, next) => {
  if (req.user?.role === 'admin') {
    return next();
  }
  return ensureSupportTeacher(req, res, next);
};

router.post(
	'/upload-csv',
	authenticateToken,
	checkRole(['admin', 'teacher']),
	allowAdminOrSupport,
	csvUpload.single('file'),
	uploadCSV
);

router.get(
	'/upload-csv/history',
	authenticateToken,
	checkRole(['admin', 'teacher']),
	allowAdminOrSupport,
	getUploadHistory
);

module.exports = router;
