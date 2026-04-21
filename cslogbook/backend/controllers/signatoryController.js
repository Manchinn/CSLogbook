const signatoryService = require('../services/signatoryService');
const logger = require('../utils/logger');

/**
 * Controller สำหรับจัดการรายชื่อผู้ลงนาม
 */
const getSignatories = async (req, res) => {
    try {
        const { isActive, role } = req.query;
        const signatories = await signatoryService.getAllSignatories({ isActive, role });
        res.json({
            success: true,
            data: signatories
        });
    } catch (error) {
        logger.error('getSignatories Controller Error:', error);
        res.status(500).json({
            success: false,
            message: 'ไม่สามารถดึงข้อมูลผู้ลงนามได้'
        });
    }
};

const getSignatoryById = async (req, res) => {
    try {
        const signatory = await signatoryService.getSignatoryById(req.params.id);
        res.json({
            success: true,
            data: signatory
        });
    } catch (error) {
        logger.error('getSignatoryById Controller Error:', error);
        res.status(error.message === 'ไม่พบข้อมูลผู้ลงนาม' ? 404 : 500).json({
            success: false,
            message: error.message || 'ไม่สามารถดึงข้อมูลผู้ลงนามได้'
        });
    }
};

const createSignatory = async (req, res) => {
    try {
        const { name, title, role, isActive } = req.body;
        
        if (!name || !title) {
            return res.status(400).json({
                success: false,
                message: 'กรุณาระบุชื่อและตำแหน่ง'
            });
        }

        const signatory = await signatoryService.createSignatory({
            name,
            title,
            role: role || 'PRIMARY',
            isActive: isActive !== undefined ? isActive : true
        });

        res.status(201).json({
            success: true,
            message: 'เพิ่มข้อมูลผู้ลงนามเรียบร้อยแล้ว',
            data: signatory
        });
    } catch (error) {
        logger.error('createSignatory Controller Error:', error);
        res.status(500).json({
            success: false,
            message: 'ไม่สามารถเพิ่มข้อมูลผู้ลงนามได้'
        });
    }
};

const updateSignatory = async (req, res) => {
    try {
        const signatory = await signatoryService.updateSignatory(req.params.id, req.body);
        res.json({
            success: true,
            message: 'อัปเดตข้อมูลผู้ลงนามเรียบร้อยแล้ว',
            data: signatory
        });
    } catch (error) {
        logger.error('updateSignatory Controller Error:', error);
        res.status(error.message === 'ไม่พบข้อมูลผู้ลงนาม' ? 404 : 500).json({
            success: false,
            message: error.message || 'ไม่สามารถอัปเดตข้อมูลผู้ลงนามได้'
        });
    }
};

const deleteSignatory = async (req, res) => {
    try {
        const result = await signatoryService.deleteSignatory(req.params.id);
        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        logger.error('deleteSignatory Controller Error:', error);
        res.status(error.message === 'ไม่พบข้อมูลผู้ลงนาม' ? 404 : 500).json({
            success: false,
            message: error.message || 'ไม่สามารถลบข้อมูลผู้ลงนามได้'
        });
    }
};

const uploadSignature = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'ไม่พบไฟล์รูปภาพ'
            });
        }

        const signatory = await signatoryService.updateSignatureImage(req.params.id, req.file);
        res.json({
            success: true,
            message: 'อัปโหลดรูปลายเซ็นเรียบร้อยแล้ว',
            data: signatory
        });
    } catch (error) {
        logger.error('uploadSignature Controller Error:', error);
        res.status(error.message === 'ไม่พบข้อมูลผู้ลงนาม' ? 404 : 500).json({
            success: false,
            message: error.message || 'ไม่สามารถอัปโหลดรูปลายเซ็นได้'
        });
    }
};

module.exports = {
    getSignatories,
    getSignatoryById,
    createSignatory,
    updateSignatory,
    deleteSignatory,
    uploadSignature
};
