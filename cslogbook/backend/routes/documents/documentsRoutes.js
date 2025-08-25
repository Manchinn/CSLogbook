const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path'); // เพิ่ม path เพราะใช้งานใน filename แต่ยังไม่ได้ import
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
// รายการเอกสารทั้งหมด (admin/staff)
router.get('/', authenticateToken, documentController.getDocuments);
// รายการเอกสารของผู้ใช้เอง (student)
router.get('/my', authenticateToken, documentController.getMyDocuments);
// แสดงไฟล์ PDF inline
router.get('/:id/view', authenticateToken, documentController.viewDocument);
// ดาวน์โหลดไฟล์ PDF
router.get('/:id/download', authenticateToken, documentController.downloadDocument);
router.get('/:id', documentController.getDocumentById);
// (ลบชั่วคราว) getDocumentHistory ยังไม่ได้ implement ใน controller
// router.get('/:id/history', authenticateToken, documentController.getDocumentHistory);
// ใช้ uploadDocument แทน submitDocument (ฟังก์ชันมีอยู่จริงใน controller)
router.post('/submit', authenticateToken, upload.single('file'), documentController.uploadDocument);
// เฉพาะเจ้าหน้าที่ภาค / อาจารย์เท่านั้นที่อนุมัติ/ปฏิเสธได้
router.post('/:id/approve', authenticateToken, checkRole(['admin','teacher']), documentController.approveDocument);
router.post('/:id/reject', authenticateToken, checkRole(['admin','teacher']), documentController.rejectDocument);
// ใช้ชื่อฟังก์ชันที่ถูกต้องใน controller คือ updateDocumentStatus
router.patch('/:id/status', authenticateToken, checkRole(['admin', 'teacher']), documentController.updateDocumentStatus);

module.exports = router;
