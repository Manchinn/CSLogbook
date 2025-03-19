const express = require('express');
const router = express.Router();
const multer = require('multer');
const { upload } = require('../../config/uploadConfig');
const { Document } = require('../../models');
const internshipController = require('../../controllers/documents/internshipController');
const { authenticateToken, checkRole } = require('../../middleware/authMiddleware');

// ============= เส้นทางสำหรับข้อมูลนักศึกษา =============
// ดึงข้อมูลนักศึกษาและสิทธิ์การฝึกงาน
router.get('/student/info',
    authenticateToken,
    checkRole(['student']),
    internshipController.getStudentInfo
);

// ============= เส้นทางสำหรับแบบฟอร์ม คพ.05 =============
// ส่งคำร้องขอฝึกงาน (คพ.05)
router.post('/cs-05/submit',
    authenticateToken, 
    checkRole(['student']),
    internshipController.submitCS05
);

// ดึงข้อมูล คพ.05 ตาม ID
router.get('/cs-05/:id',
    authenticateToken,
    internshipController.getCS05ById
);

// ดึงข้อมูล คพ.05 ปัจจุบันของนักศึกษา
router.get('/current-cs05',
    authenticateToken,
    checkRole(['student']),
    internshipController.getCurrentCS05
);

// บันทึกข้อมูลบริษัท/หน่วยงานฝึกงาน
router.post('/company-info',
    authenticateToken,
    checkRole(['student']),
    (req, res, next) => {
        // Validate required fields
        const { documentId, supervisorName, supervisorPhone, supervisorEmail } = req.body;
        if (!documentId) {
            return res.status(400).json({
                success: false,
                message: 'กรุณาระบุ Document ID'
            });
        }
        next();
    },
    internshipController.submitCompanyInfo
);

// ดึงข้อมูลผู้ควบคุมงาน
router.get('/company-info/:documentId',
    authenticateToken,
    checkRole(['student']),
    internshipController.getCompanyInfo
);

// บันทึกข้อมูลบริษัท/หน่วยงานฝึกงาน
router.post('/company-info',
    // ...existing code...
);

// ============= เส้นทางสำหรับอัปโหลดเอกสาร =============
// อัปโหลดใบแสดงผลการเรียน (Transcript)
router.post('/upload-transcript',
    authenticateToken,
    checkRole(['student']),
    upload.single('file'),
    async (req, res) => {
        try {
            // หา CS05 ที่มีอยู่
            const existingCS05 = await Document.findOne({
                where: {
                    userId: req.user.userId,
                    documentName: 'CS05',
                    category: 'proposal',
                    status: 'pending'
                }
            });

            if (!existingCS05) {
                return res.status(400).json({
                    success: false,
                    message: 'กรุณาสร้างแบบฟอร์ม CS05 ก่อนอัปโหลด Transcript'
                });
            }

            // อัปเดท Document เดิม
            await existingCS05.update({
                filePath: req.file.path,
                fileName: req.file.filename,
                mimeType: req.file.mimetype,
                fileSize: req.file.size
            });

            res.json({
                success: true,
                fileUrl: `/uploads/internship/transcript/${req.file.filename}`,
                documentId: existingCS05.id
            });

        } catch (error) {
            console.error('Upload Error:', error);
            res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์'
            });
        }
    }
);

// ============= เส้นทางที่ยังไม่ได้ใช้งาน (รอการพัฒนา) =============

/* // ดึงรายการ คพ.05 ทั้งหมดของนักศึกษา
router.get('/cs-05/list',
    authenticateToken,
    internshipController.getCS05List
); */

/* // === เส้นทางสำหรับสมุดบันทึกการฝึกงาน ===
// เพิ่มบันทึกประจำวัน
router.post('/logbook/entry',
    authenticateToken,
    checkRole(['student']),
    internshipController.addLogbookEntry
);

// ดึงรายการบันทึกการฝึกงาน
router.get('/logbook',
    authenticateToken,
    internshipController.getLogbookEntries
); */

/* // === เส้นทางสำหรับจัดการไฟล์เอกสาร ===
// อัปโหลดไฟล์เอกสาร
router.post('/upload',
    authenticateToken,
    upload.single('file'),
    internshipController.uploadDocument
);

// ดึงรายการเอกสารทั้งหมด
router.get('/',
    authenticateToken,
    internshipController.getDocuments
);

// ดึงข้อมูลเอกสารตาม ID
router.get('/:id',
    authenticateToken,
    internshipController.getDocumentById
);

// ดาวน์โหลดเอกสาร
router.get('/:id/download',
    authenticateToken,
    internshipController.downloadDocument
); */

/* // === เส้นทางสำหรับผู้ดูแลระบบ ===
// อัพเดทสถานะเอกสาร
router.patch('/:id/status',
    authenticateToken,
    checkRole(['admin', 'teacher']),
    internshipController.updateStatus
); */

module.exports = router;
