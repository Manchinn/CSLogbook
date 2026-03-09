/**
 * Sanitize filename — ลบ characters ที่ไม่ปลอดภัยในชื่อไฟล์
 * @param {string} name - ชื่อไฟล์ที่ต้อง sanitize
 * @returns {string} ชื่อไฟล์ที่ปลอดภัย
 */
function sanitizeFilename(name) {
    if (!name) return 'unnamed';
    return name
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
        .replace(/\s+/g, '_')
        .substring(0, 200);
}

module.exports = { sanitizeFilename };
