/**
 * สร้าง allowedOrigins จาก ALLOWED_ORIGINS env var
 * ใช้ร่วมกันทั้ง Express CORS (app.js) และ Socket.io CORS (server.js)
 *
 * ALLOWED_ORIGINS = comma-separated list เช่น:
 *   development: http://localhost:3000,http://127.0.0.1:3000
 *   production:  https://cslogbook.me,https://www.cslogbook.me
 */
const buildAllowedOrigins = () => {
  const fromEnv = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim().replace(/\/$/, '')).filter(Boolean)
    : [];
  // fallback dev origins ถ้าไม่ได้ตั้งค่า ALLOWED_ORIGINS
  const devFallback = fromEnv.length === 0
    ? ['http://localhost:3000', 'http://127.0.0.1:3000']
    : [];
  return [...new Set([...fromEnv, ...devFallback])];
};

module.exports = { buildAllowedOrigins };
