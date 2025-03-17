const multer = require('multer');
const path = require('path');
const fs = require('fs');

// กำหนดค่าคงที่
const UPLOAD_CONFIG = {
    BASE_PATH: path.join(__dirname, '..', 'uploads'),
    MAX_FILE_SIZE: 5 * 1024 * 1024,
    ALLOWED_TYPES: ['application/pdf'],
    DOCUMENT_TYPES: {
        INTERNSHIP: {
            path: 'internship',
            allowedCategories: ['transcript']
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
        try {
            const documentType = req.body?.documentType || 'INTERNSHIP';
            const category = req.body?.category || 'transcript';
            
            const docTypeConfig = UPLOAD_CONFIG.DOCUMENT_TYPES[documentType];
            if (!docTypeConfig) {
                throw new Error('ประเภทเอกสารไม่ถูกต้อง');
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
        const fileExt = path.extname(file.originalname);
        const fileName = `transcript-${timestamp}${fileExt}`;
        cb(null, fileName);
    }
});

// สร้าง multer instance
const upload = multer({
    storage,
    limits: {
        fileSize: UPLOAD_CONFIG.MAX_FILE_SIZE
    },
    fileFilter: (req, file, cb) => {
        if (!UPLOAD_CONFIG.ALLOWED_TYPES.includes(file.mimetype)) {
            cb(new Error('รองรับเฉพาะไฟล์ PDF เท่านั้น'), false);
            return;
        }
        cb(null, true);
    }
});

const deleteOldFile = async (filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            await fs.promises.unlink(filePath);
        }
    } catch (error) {
        console.error('Error deleting old file:', error);
    }
};

const customRequest = async ({ file, onSuccess, onError }) => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        // เพิ่ม documentType และ category
        formData.append('documentType', 'internship'); 
        formData.append('category', 'transcript');

        const response = await internshipService.uploadTranscript(file);
        // ...existing code...
    } catch (error) {
        onError(error);
    }
};

// Export functions และค่าคงที่
module.exports = {
    upload,
    UPLOAD_CONFIG,
    ensureDirectoryExists,
    deleteOldFile,
    customRequest
};