const { Signatory } = require('../models');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');
const { SIGNATURE_UPLOAD_CONFIG } = require('../config/uploadConfig');

class SignatoryService {
    /**
     * ดึงข้อมูลผู้ลงนามทั้งหมด
     */
    async getAllSignatories(filters = {}) {
        try {
            const where = {};
            if (filters.isActive !== undefined) {
                where.isActive = filters.isActive === 'true' || filters.isActive === true;
            }
            if (filters.role) {
                where.role = filters.role;
            }

            return await Signatory.findAll({
                where,
                order: [
                    ['isActive', 'DESC'],
                    ['role', 'ASC'],
                    ['name', 'ASC']
                ]
            });
        } catch (error) {
            logger.error('Error fetching signatories:', error);
            throw error;
        }
    }

    /**
     * ดึงข้อมูลผู้ลงนามตาม ID
     */
    async getSignatoryById(id) {
        try {
            const signatory = await Signatory.findByPk(id);
            if (!signatory) {
                throw new Error('ไม่พบข้อมูลผู้ลงนาม');
            }
            return signatory;
        } catch (error) {
            logger.error('Error fetching signatory by id:', error);
            throw error;
        }
    }

    /**
     * สร้างผู้ลงนามใหม่
     */
    async createSignatory(data) {
        try {
            // ถ้าเป็นผู้ลงนามหลัก และตั้งค่าเป็น active ให้ตรวจสอบตัวอื่นก่อน
            if (data.role === 'PRIMARY' && data.isActive) {
                await this._deactivateOtherPrimary();
            }

            return await Signatory.create(data);
        } catch (error) {
            logger.error('Error creating signatory:', error);
            throw error;
        }
    }

    /**
     * อัปเดตข้อมูลผู้ลงนาม
     */
    async updateSignatory(id, data) {
        try {
            const signatory = await Signatory.findByPk(id);
            if (!signatory) {
                throw new Error('ไม่พบข้อมูลผู้ลงนาม');
            }

            // ถ้าเปลี่ยนเป็น PRIMARY + Active ให้ deactivate ตัวอื่น
            if (data.role === 'PRIMARY' && data.isActive) {
                await this._deactivateOtherPrimary(id);
            }

            await signatory.update(data);
            return signatory;
        } catch (error) {
            logger.error('Error updating signatory:', error);
            throw error;
        }
    }

    /**
     * ลบผู้ลงนาม
     */
    async deleteSignatory(id) {
        try {
            const signatory = await Signatory.findByPk(id);
            if (!signatory) {
                throw new Error('ไม่พบข้อมูลผู้ลงนาม');
            }

            // ลบรูปลายเซ็นถ้ามี
            if (signatory.signatureUrl) {
                const filePath = path.join(__dirname, '..', signatory.signatureUrl);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }

            await signatory.destroy();
            return { message: 'ลบข้อมูลผู้ลงนามเรียบร้อยแล้ว' };
        } catch (error) {
            logger.error('Error deleting signatory:', error);
            throw error;
        }
    }

    /**
     * จัดการรูปลายเซ็น (พร้อมลบพื้นหลังอัตโนมัติ)
     */
    async updateSignatureImage(id, file) {
        try {
            const signatory = await Signatory.findByPk(id);
            if (!signatory) {
                throw new Error('ไม่พบข้อมูลผู้ลงนาม');
            }

            // ลบไฟล์เก่าถ้ามี
            if (signatory.signatureUrl) {
                const oldPath = path.join(__dirname, '..', signatory.signatureUrl);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }

            // --- ลบพื้นหลังอัตโนมัติ ---
            const { removeWhiteBackground } = require('../utils/imageUtils');
            const processedBuffer = await removeWhiteBackground(file.path);
            
            // แก้ไขนามสกุลเป็น .png เนื่องจากเราแปลงเป็น PNG โปร่งใส
            const newPath = file.path.replace(/\.[^/.]+$/, "") + ".png";
            fs.writeFileSync(newPath, processedBuffer);
            
            // ลบไฟล์ต้นฉบับถ้าคนละไฟล์กัน
            if (newPath !== file.path && fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }

            // สร้าง path สำหรับเก็บใน DB (relative path จาก project root)
            const relativePath = path.relative(
                path.join(__dirname, '..'),
                newPath
            ).replace(/\\/g, '/');

            await signatory.update({ signatureUrl: relativePath });
            return signatory;
        } catch (error) {
            logger.error('Error updating signature image:', error);
            throw error;
        }
    }

    /**
     * Helper: ปิดการใช้งานผู้ลงนามหลักตัวอื่น (เพื่อให้มีคนเดียวที่ active)
     */
    async _deactivateOtherPrimary(excludeId = null) {
        const { Op } = require('sequelize');
        const where = {
            role: 'PRIMARY',
            isActive: true
        };
        if (excludeId) {
            where.id = { [Op.ne]: excludeId };
        }

        await Signatory.update(
            { isActive: false },
            { where }
        );
    }
}

module.exports = new SignatoryService();
