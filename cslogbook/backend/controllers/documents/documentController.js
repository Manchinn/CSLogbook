const { Document } = require('../../models');
const { UPLOAD_CONFIG } = require('../../config/uploadConfig');
const fs = require('fs').promises;
const path = require('path');

// อัพโหลดเอกสาร
const uploadDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'ไม่พบไฟล์ที่อัปโหลด'
            });
        }

        const { documentType, category } = req.body;

        // ตรวจสอบประเภทเอกสาร
        const docTypeConfig = UPLOAD_CONFIG.DOCUMENT_TYPES[documentType?.toUpperCase()];
        if (!docTypeConfig) {
            return res.status(400).json({
                success: false,
                message: 'ประเภทเอกสารไม่ถูกต้อง'
            });
        }

        // บันทึกข้อมูลลงฐานข้อมูล
        const document = await Document.create({
            userId: req.user.id,
            documentType,
            category,
            filePath: req.file.path,
            fileName: req.file.filename,
            mimeType: req.file.mimetype,
            fileSize: req.file.size,
            status: 'pending'
        });

        res.json({
            success: true,
            documentId: document.id,
            fileUrl: `/uploads/${req.file.filename}`,
            message: 'อัปโหลดไฟล์สำเร็จ'
        });

    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์'
        });
    }
};

// ดึงข้อมูลเอกสาร
const getDocumentById = async (req, res) => {
    try {
        const document = await Document.findByPk(req.params.id);
        
        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'ไม่พบเอกสาร'
            });
        }

        res.json({
            success: true,
            data: document
        });

    } catch (error) {
        console.error('Get Document Error:', error);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการดึงข้อมูลเอกสาร'
        });
    }
};

// อัพเดทสถานะเอกสาร
const updateDocumentStatus = async (req, res) => {
    try {
        const { status, comment } = req.body;
        const document = await Document.findByPk(req.params.id);

        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'ไม่พบเอกสาร'
            });
        }

        await document.update({
            status,
            comment,
            reviewedBy: req.user.id,
            reviewedAt: new Date()
        });

        res.json({
            success: true,
            message: 'อัพเดทสถานะเอกสารสำเร็จ'
        });

    } catch (error) {
        console.error('Update Status Error:', error);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการอัพเดทสถานะเอกสาร'
        });
    }
};

module.exports = {
    uploadDocument,
    getDocumentById,
    updateDocumentStatus
};