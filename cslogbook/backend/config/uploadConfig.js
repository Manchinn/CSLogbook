const multer = require('multer');
const path = require('path');
const fs = require('fs');

// กำหนดค่าคงที่ - เพิ่มการรองรับหนังสือตอบรับ
const UPLOAD_CONFIG = {
    BASE_PATH: path.join(__dirname, '..', 'uploads'),
    MAX_FILE_SIZE: 10 * 1024 * 1024, // เพิ่มเป็น 10MB สำหรับหนังสือตอบรับ
    ALLOWED_TYPES: ['application/pdf'],
    DOCUMENT_TYPES: {
        INTERNSHIP: {
            path: 'internship',
            allowedCategories: [
                'transcript',
                'acceptance-letter' // 🆕 เพิ่มหมวดหมู่หนังสือตอบรับ
            ]
        }
    }
};

// 🆕 กำหนดการอัปโหลดไฟล์ CSV สำหรับรายชื่อนักศึกษาไว้ที่เดียว
const CSV_UPLOAD_CONFIG = {
    PATH: path.join(UPLOAD_CONFIG.BASE_PATH, 'csv'),
    MAX_FILE_SIZE: 5 * 1024 * 1024,
    ALLOWED_TYPES: [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel.sheet.macroenabled.12'
    ],
    ALLOWED_EXTENSIONS: ['.csv', '.xlsx']
};

// 🆕 Configuration for signatures
const SIGNATURE_UPLOAD_CONFIG = {
    PATH: path.join(UPLOAD_CONFIG.BASE_PATH, 'signatures'),
    MAX_FILE_SIZE: 500 * 1024, // 500KB
    ALLOWED_TYPES: ['image/png', 'image/jpeg'],
    ALLOWED_EXTENSIONS: ['.png', '.jpg', '.jpeg']
};

// สร้างโฟลเดอร์อัตโนมัติ
const ensureDirectoryExists = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

// กำหนดการจัดเก็บไฟล์ - ปรับปรุงให้รองรับหลายประเภท
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        try {
            const documentType = req.body?.documentType || 'INTERNSHIP';
            
            // 🆕 จำแนกประเภทไฟล์ตาม fieldname
            let category;
            if (file.fieldname === 'transcript') {
                category = 'transcript';
            } else if (file.fieldname === 'acceptanceLetter') {
                category = 'acceptance-letter';
            } else {
                category = req.body?.category || 'transcript';
            }
            
            const docTypeConfig = UPLOAD_CONFIG.DOCUMENT_TYPES[documentType];
            if (!docTypeConfig) {
                throw new Error('ประเภทเอกสารไม่ถูกต้อง');
            }

            // ตรวจสอบว่า category ที่ส่งมาได้รับอนุญาตหรือไม่
            if (!docTypeConfig.allowedCategories.includes(category)) {
                throw new Error(`ประเภทเอกสาร ${category} ไม่ได้รับอนุญาต`);
            }

            const uploadPath = path.join(
                UPLOAD_CONFIG.BASE_PATH,
                docTypeConfig.path,
                category
            );
            
            ensureDirectoryExists(uploadPath);
            cb(null, uploadPath);
        } catch (error) {
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const userId = req.user?.userId || 'unknown';
        const fileExt = path.extname(file.originalname);
        
        // 🆕 สร้างชื่อไฟล์ตาม fieldname
        let fileName;
        if (file.fieldname === 'transcript') {
            fileName = `transcript-${userId}-${timestamp}${fileExt}`;
        } else if (file.fieldname === 'acceptanceLetter') {
            fileName = `acceptance-letter-${userId}-${timestamp}${fileExt}`;
        } else {
            fileName = `document-${userId}-${timestamp}${fileExt}`;
        }
        
        cb(null, fileName);
    }
});

// 🆕 สร้าง storage สำหรับไฟล์ CSV แยกเฉพาะทาง
const csvStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        try {
            ensureDirectoryExists(CSV_UPLOAD_CONFIG.PATH);
            cb(null, CSV_UPLOAD_CONFIG.PATH);
        } catch (error) {
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        cb(null, `${timestamp}-${sanitizedName}`);
    }
});

// 🆕 Storage specifically for signatures
const signatureStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        try {
            ensureDirectoryExists(SIGNATURE_UPLOAD_CONFIG.PATH);
            cb(null, SIGNATURE_UPLOAD_CONFIG.PATH);
        } catch (error) {
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const fileExt = path.extname(file.originalname);
        cb(null, `signature-${timestamp}${fileExt}`);
    }
});

// สร้าง multer instance - ปรับปรุง fileFilter
const upload = multer({
    storage,
    limits: {
        fileSize: UPLOAD_CONFIG.MAX_FILE_SIZE,
        files: 1 // จำกัดไฟล์เดียว
    },
    fileFilter: (req, file, cb) => {
        // ตรวจสอบประเภทไฟล์
        if (!UPLOAD_CONFIG.ALLOWED_TYPES.includes(file.mimetype)) {
            const error = new Error('รองรับเฉพาะไฟล์ PDF เท่านั้น');
            error.code = 'INVALID_FILE_TYPE';
            cb(error, false);
            return;
        }

        // 🆕 ตรวจสอบขนาดไฟล์ล่วงหน้า
        if (req.headers['content-length'] && parseInt(req.headers['content-length']) > UPLOAD_CONFIG.MAX_FILE_SIZE) {
            const error = new Error('ขนาดไฟล์ต้องไม่เกิน 10MB');
            error.code = 'FILE_TOO_LARGE';
            cb(error, false);
            return;
        }
        
        cb(null, true);
    }
});

// 🆕 ตัวอัปโหลด CSV ที่ใช้ร่วมทุกที่ให้สอดคล้องกับแพทเทิร์นกลาง
const csvUpload = multer({
    storage: csvStorage,
    limits: {
        fileSize: CSV_UPLOAD_CONFIG.MAX_FILE_SIZE
    },
    fileFilter: (req, file, cb) => {
        const mimetype = file.mimetype;
        const extension = path.extname(file.originalname || '').toLowerCase();
        const isAllowedMimeType = CSV_UPLOAD_CONFIG.ALLOWED_TYPES.includes(mimetype);
        const isAllowedExtension = CSV_UPLOAD_CONFIG.ALLOWED_EXTENSIONS.includes(extension);

        if (!isAllowedMimeType && !isAllowedExtension) {
            const error = new Error('รองรับเฉพาะไฟล์ CSV หรือ Excel (.xlsx) เท่านั้น');
            error.code = 'INVALID_CSV_TYPE';
            return cb(error, false);
        }
        cb(null, true);
    }
});

// 🆕 ตัวอัปโหลด Signature
const signatureUpload = multer({
    storage: signatureStorage,
    limits: {
        fileSize: SIGNATURE_UPLOAD_CONFIG.MAX_FILE_SIZE
    },
    fileFilter: (req, file, cb) => {
        if (!SIGNATURE_UPLOAD_CONFIG.ALLOWED_TYPES.includes(file.mimetype)) {
            const error = new Error('รองรับเฉพาะไฟล์รูปภาพ (PNG, JPG) เท่านั้น');
            error.code = 'INVALID_SIGNATURE_TYPE';
            return cb(error, false);
        }
        cb(null, true);
    }
});

// ฟังก์ชันลบไฟล์เก่า
const deleteOldFile = async (filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            await fs.promises.unlink(filePath);
            console.log(`Deleted old file: ${filePath}`);
        }
    } catch (error) {
        console.error('Error deleting old file:', error);
    }
};

// 🆕 ฟังก์ชันตรวจสอบประเภทไฟล์
const validateFileType = (file, allowedTypes = UPLOAD_CONFIG.ALLOWED_TYPES) => {
    if (!file || !file.mimetype) {
        return { valid: false, error: 'ไม่พบข้อมูลไฟล์' };
    }

    if (!allowedTypes.includes(file.mimetype)) {
        return { 
            valid: false, 
            error: `รองรับเฉพาะไฟล์ ${allowedTypes.join(', ')} เท่านั้น` 
        };
    }

    return { valid: true };
};

// 🆕 ฟังก์ชันตรวจสอบขนาดไฟล์
const validateFileSize = (file, maxSize = UPLOAD_CONFIG.MAX_FILE_SIZE) => {
    if (!file || !file.size) {
        return { valid: false, error: 'ไม่พบข้อมูลขนาดไฟล์' };
    }

    if (file.size > maxSize) {
        const maxSizeMB = Math.round(maxSize / (1024 * 1024));
        return { 
            valid: false, 
            error: `ขนาดไฟล์ต้องไม่เกิน ${maxSizeMB}MB` 
        };
    }

    return { valid: true };
};

// 🆕 ฟังก์ชันสร้าง path สำหรับไฟล์
const generateFilePath = (documentType, category, filename) => {
    const docTypeConfig = UPLOAD_CONFIG.DOCUMENT_TYPES[documentType];
    if (!docTypeConfig) {
        throw new Error('ประเภทเอกสารไม่ถูกต้อง');
    }

    return path.join(
        UPLOAD_CONFIG.BASE_PATH,
        docTypeConfig.path,
        category,
        filename
    );
};

// Export functions และค่าคงที่
module.exports = {
    upload,
    csvUpload,
    signatureUpload,
    UPLOAD_CONFIG,
    CSV_UPLOAD_CONFIG,
    SIGNATURE_UPLOAD_CONFIG,
    ensureDirectoryExists,
    deleteOldFile,
    validateFileType,
    validateFileSize,
    generateFilePath
};