const multer = require('multer');
const path = require('path');
const fs = require('fs');

// กำหนดค่าคงที่
const UPLOAD_CONFIG = {
    BASE_PATH: path.join(__dirname, '..', 'uploads'),
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['application/pdf'],
    DOCUMENT_TYPES: {
        PROJECT: {
            path: 'project',
            allowedCategories: [
                'CS-01',     // เอกสารเสนอหัวข้อ
                'CS-02',     // เอกสารขอสอบ
                'CS-04',     // เอกสารรับรองการทดสอบ
                'logbook',   // สมุดบันทึกคำปรึกษา
                'support'    // เอกสารประกอบอื่นๆ
            ]
        },
        INTERNSHIP: {
            path: 'internship',
            allowedCategories: [
                'CS-05',     // เอกสารขอฝึกงาน
                'logbook',   // สมุดบันทึกฝึกงาน
                'evaluation', // แบบประเมิน
                'support'    // เอกสารประกอบอื่นๆ
            ]
        }
    }
};

// สร้างโฟลเดอร์อัตโนมัติ
const ensureDirectoryExists = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

// กำหนดการจัดเก็บไฟล์
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const { documentType, category } = req.body;
        
        // ตรวจสอบ document type
        const docTypeConfig = UPLOAD_CONFIG.DOCUMENT_TYPES[documentType.toUpperCase()];
        if (!docTypeConfig) {
            return cb(new Error('Invalid document type'));
        }

        // สร้าง path
        const uploadPath = path.join(
            UPLOAD_CONFIG.BASE_PATH,
            docTypeConfig.path,
            category || 'other'
        );

        // สร้างโฟลเดอร์ถ้ายังไม่มี
        ensureDirectoryExists(uploadPath);
        
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const studentId = req.user.studentId;
        const timestamp = Date.now();
        const fileExt = path.extname(file.originalname);
        
        // format: studentId-documentType-category-timestamp.pdf
        const fileName = `${studentId}-${req.body.documentType}-${req.body.category}-${timestamp}${fileExt}`;
        
        cb(null, fileName);
    }
});

// ตรวจสอบไฟล์
const fileFilter = (req, file, cb) => {
    // ตรวจสอบประเภทไฟล์
    if (!UPLOAD_CONFIG.ALLOWED_TYPES.includes(file.mimetype)) {
        return cb(new Error('รองรับเฉพาะไฟล์ PDF เท่านั้น'), false);
    }

    // ตรวจสอบ category
    const { documentType, category } = req.body;
    const docTypeConfig = UPLOAD_CONFIG.DOCUMENT_TYPES[documentType.toUpperCase()];
    
    if (!docTypeConfig.allowedCategories.includes(category)) {
        return cb(new Error('Invalid category for document type'), false);
    }

    cb(null, true);
};

// สร้าง multer instance
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: UPLOAD_CONFIG.MAX_FILE_SIZE,
        files: 1
    }
});

// Export functions และค่าคงที่
module.exports = {
    upload,
    UPLOAD_CONFIG,
    ensureDirectoryExists
};