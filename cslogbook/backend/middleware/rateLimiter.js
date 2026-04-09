const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 15, // จำกัด 15 ครั้งต่อ IP ต่อ 15 นาที
    standardHeaders: true,
    legacyHeaders: false,
    // เพิ่ม handler สำหรับ error
    handler: (req, res) => {
        res.status(429).json({
            status: 'error',
            message: 'มีการล็อกอินผิดพลาดหลายครั้ง กรุณารอ 15 นาทีแล้วลองใหม่',
            code: 'TOO_MANY_ATTEMPTS'
        });
    }
});

module.exports = loginLimiter;