const express = require('express');
const router = express.Router();
const { upload } = require('../../config/uploadConfig');
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
