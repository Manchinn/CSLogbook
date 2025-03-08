const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 15 นาที
    max: 100, // จำกัด 5 ครั้งต่อ IP
    message: {
        success: false,
        error: 'มีการพยายามเข้าสู่ระบบมากเกินไป กรุณาลองใหม่ในอีก 15 นาที'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = loginLimiter;