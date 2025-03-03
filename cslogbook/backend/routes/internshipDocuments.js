const express = require('express');
const multer = require('multer');
const path = require('path');

// กำหนดการตั้งค่า multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/') // กำหนดโฟลเดอร์ที่จะเก็บไฟล์
  },
  filename: function (req, file, cb) {
    // สร้างชื่อไฟล์ที่ไม่ซ้ำกัน
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

// กำหนดการกรองไฟล์
const fileFilter = (req, file, cb) => {
  // อนุญาตเฉพาะไฟล์ PDF
  if (file.mimetype === 'application/pdf') {
    cb(null, true)
  } else {
    cb(new Error('Only PDF files are allowed!'), false)
  }
}

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // จำกัดขนาดไฟล์ที่ 10MB
    files: 5 // จำกัดจำนวนไฟล์สูงสุดที่อัปโหลดได้
  },
  fileFilter: fileFilter
});

const router = express.Router();
const { submitInternshipDocuments, getInternshipDocuments, getInternshipDocumentById, approveInternshipDocument, rejectInternshipDocument, uploadInternshipDocument } = require('../controllers/internshipDocumentController');
const { authenticateToken, checkRole } = require('../middleware/authMiddleware');
require('./swagger/internshipDocuments');

router.post('/submit', authenticateToken, checkRole(['student']), upload.array('file'), submitInternshipDocuments);

router.post('/upload', authenticateToken, upload.single('file'), uploadInternshipDocument);

router.get('/', authenticateToken, checkRole(['admin']), getInternshipDocuments);

router.get('/:id', authenticateToken, checkRole(['admin']), getInternshipDocumentById);

router.post('/:id/approve', authenticateToken, checkRole(['admin']), approveInternshipDocument);

router.post('/:id/reject', authenticateToken, checkRole(['admin']), rejectInternshipDocument);

module.exports = router;
