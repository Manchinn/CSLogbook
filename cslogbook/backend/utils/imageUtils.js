const sharp = require('sharp');
const logger = require('./logger');

/**
 * ลบพื้นหลังสีขาวออกจากรูปภาพ (ทำให้โปร่งใส)
 * @param {Buffer|string} input - Buffer ของรูปภาพ หรือ path ของไฟล์
 * @returns {Promise<Buffer>} - Buffer ของรูปภาพ PNG ที่ไม่มีพื้นหลัง
 */
async function removeWhiteBackground(input) {
    try {
        const image = sharp(input);
        const { data, info } = await image
            .ensureAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true });

        // วนลูปตรวจสอบพิกเซล
        // data เป็น Uint8Array ที่มีลำดับ [R, G, B, A, R, G, B, A, ...]
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // ถ้าสีใกล้เคียงสีขาว (ค่าสูงกว่า 200 ทั้ง RGB)
            // ปรับจาก 240 เป็น 200 เพื่อให้ลบพื้นหลังที่เป็นสีเทาอ่อนหรือมีเงาได้ดีขึ้น
            if (r > 200 && g > 200 && b > 200) {
                data[i + 3] = 0; // ตั้งค่า Alpha เป็น 0 (โปร่งใส)
            }
        }

        // แปลงกลับเป็น PNG
        return await sharp(data, {
            raw: {
                width: info.width,
                height: info.height,
                channels: 4
            }
        })
        .png()
        .toBuffer();
    } catch (error) {
        logger.error('Error removing white background:', error);
        throw error;
    }
}

module.exports = {
    removeWhiteBackground
};
