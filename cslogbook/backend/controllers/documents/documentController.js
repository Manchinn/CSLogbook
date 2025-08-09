const fs = require('fs');
const path = require('path');
const documentService = require('../../services/documentService');
const logger = require('../../utils/logger');
// อัพโหลดเอกสาร
const uploadDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'ไม่พบไฟล์ที่อัปโหลด'
            });
        }

        const result = await documentService.uploadDocument(
            req.user.userId, 
            req.file, 
            req.body
        );

        res.json({
            success: true,
            ...result
        });

    } catch (error) {
        logger.error('Upload Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์'
        });
    }
};

// ดึงข้อมูลเอกสาร
const getDocumentById = async (req, res) => {
    try {
        const documentData = await documentService.getDocumentById(req.params.id);
        
        res.json({
            success: true,
            data: documentData
        });

    } catch (error) {
        logger.error('Get Document Error:', error);
        
        if (error.message === 'ต้องระบุ ID ของเอกสาร') {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        
        if (error.message === 'ไม่พบเอกสาร') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการดึงข้อมูลเอกสาร',
            error: error.message
        });
    }
};

// อัพเดทสถานะเอกสาร
const updateDocumentStatus = async (req, res) => {
    try {
        const { status, comment } = req.body;
        
        const result = await documentService.updateDocumentStatus(
            req.params.id,
            status,
            req.user.userId,
            comment
        );

        res.json({
            success: true,
            ...result
        });

    } catch (error) {
        logger.error('Update Status Error:', error);
        
        if (error.message === 'ไม่พบเอกสาร') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการอัพเดทสถานะเอกสาร'
        });
    }
};

// ดึงข้อมูลเอกสารทั้งหมด
const getDocuments = async (req, res) => {
    try {
        const { type, status, search, limit, offset } = req.query;
        
        const filters = { type, status, search };
        const pagination = { 
            limit: limit ? parseInt(limit) : 50, 
            offset: offset ? parseInt(offset) : 0 
        };
        
        const result = await documentService.getDocuments(filters, pagination);
        
        res.json(result);
        
    } catch (error) {
        logger.error('Error fetching documents:', error);
        res.status(500).json({
            success: false, 
            message: 'เกิดข้อผิดพลาดในการดึงข้อมูลเอกสาร',
            error: error.message
        });
    }
};

// อนุมัติเอกสาร
const approveDocument = async (req, res) => {
    try {
    const result = await documentService.approveDocument(req.params.id, req.user.userId);

        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        logger.error('Error approving document:', error);
        
        if (error.message === 'ไม่พบเอกสาร') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการอนุมัติเอกสาร'
        });    }
};

// ปฏิเสธเอกสาร
const rejectDocument = async (req, res) => {
    try {
        const { reason } = req.body;
        
        const result = await documentService.rejectDocument(
            req.params.id,
            req.user.userId,
            reason
        );

        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        logger.error('Error rejecting document:', error);
        
        if (error.message === 'ไม่พบเอกสาร') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการปฏิเสธเอกสาร'
        });
    }
};

// ค้นหาเอกสาร
const searchDocuments = async (req, res) => {
    try {
        const { query, type } = req.query;
        
        const result = await documentService.searchDocuments(query, { type });
        
        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        logger.error('Error searching documents:', error);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการค้นหาเอกสาร'
        });
    }
};

// ดึงเอกสารล่าสุด
const getRecentDocuments = async (req, res) => {
    try {
        const { limit } = req.query;
        
        const result = await documentService.getRecentDocuments(
            limit ? parseInt(limit) : 10
        );
        
        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        logger.error('Error fetching recent documents:', error);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการดึงข้อมูลเอกสารล่าสุด'
        });
    }
};

// แสดงไฟล์เอกสาร PDF โดยตรงในเบราว์เซอร์
const viewDocument = async (req, res) => {
    try {
        const document = await documentService.validateDocumentFile(req.params.id);

        // ตั้งค่า header สำหรับการแสดงไฟล์ PDF โดยตรงใน browser
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${document.fileName || path.basename(document.filePath)}"`);
        
        // อ่านและส่งไฟล์
        const fileStream = fs.createReadStream(document.filePath);
        fileStream.pipe(res);
        
    } catch (error) {
        logger.error('View Document Error:', error);
        
        if (error.message === 'ไม่พบเอกสาร') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        
        if (error.message === 'ไม่พบไฟล์เอกสาร') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการแสดงเอกสาร'
        });
    }
};

// ดาวน์โหลดไฟล์เอกสาร
const downloadDocument = async (req, res) => {
    try {
        const document = await documentService.validateDocumentFile(req.params.id);

        // ตั้งค่าการดาวน์โหลดไฟล์
        const fileName = document.fileName || path.basename(document.filePath);
        res.setHeader('Content-Type', document.mimeType || 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        
        // ส่งไฟล์
        const fileStream = fs.createReadStream(document.filePath);
        fileStream.pipe(res);
        
    } catch (error) {
        logger.error('Download Document Error:', error);
        
        if (error.message === 'ไม่พบเอกสาร') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        
        if (error.message === 'ไม่พบไฟล์เอกสาร') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการดาวน์โหลดเอกสาร'
        });
    }
};

// ============= Certificate Management for Admin =============

/**
 * ดึงรายการคำขอหนังสือรับรองทั้งหมด (สำหรับ Admin)
 */
const getCertificateRequests = async (req, res) => {
    try {
        const { page, limit, status, studentId } = req.query;
        
        const filters = { status, studentId };
        const pagination = { page, limit };
        
        const result = await documentService.getCertificateRequests(filters, pagination);
        
        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        logger.error('Error fetching certificate requests:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'ไม่สามารถดึงข้อมูลคำขอได้',
        });
    }
};

/**
 * อนุมัติคำขอหนังสือรับรอง (สำหรับ Admin)
 */
const approveCertificateRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { certificateNumber } = req.body;
        const processorId = req.user.userId;

        const result = await documentService.approveCertificateRequest(
            requestId, 
            processorId, 
            certificateNumber
        );

        res.json({
            success: true,
            message: 'อนุมัติคำขอหนังสือรับรองเรียบร้อยแล้ว',
            data: result,
        });
    } catch (error) {
        logger.error('Error approving certificate request:', error);
        
        const statusCode = error.message.includes('ไม่พบ') ? 404 :
                          error.message.includes('ได้รับการดำเนินการแล้ว') ? 400 : 500;
        
        res.status(statusCode).json({
            success: false,
            message: error.message || 'ไม่สามารถอนุมัติคำขอได้',
        });
    }
};

/**
 * ปฏิเสธคำขอหนังสือรับรอง (สำหรับ Admin)
 */
const rejectCertificateRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { remarks } = req.body;
        const processorId = req.user.userId;

        const result = await documentService.rejectCertificateRequest(
            requestId, 
            processorId, 
            remarks
        );

        res.json({
            success: true,
            message: 'ปฏิเสธคำขอเรียบร้อยแล้ว',
            data: result,
        });
    } catch (error) {
        logger.error('Error rejecting certificate request:', error);
        
        const statusCode = error.message.includes('ไม่พบ') ? 404 :
                          error.message.includes('ได้รับการดำเนินการแล้ว') ? 400 : 500;
        
        res.status(statusCode).json({
            success: false,
            message: error.message || 'ไม่สามารถปฏิเสธคำขอได้',
        });
    }
};

/**
 * ดาวน์โหลดหนังสือรับรองสำหรับ Admin
 */
const downloadCertificateForAdmin = async (req, res) => {
    try {
        const { requestId } = req.params;

        const pdfBuffer = await documentService.generateCertificatePDF(requestId);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="certificate-${requestId}.pdf"`);
        res.send(pdfBuffer);

    } catch (error) {
        logger.error('Error downloading certificate:', error);
        
        const statusCode = error.message.includes('ไม่พบ') ? 404 :
                          error.message.includes('ยังไม่ได้รับการอนุมัติ') ? 400 : 500;
        
        res.status(statusCode).json({
            success: false,
            message: error.message || 'ไม่สามารถดาวน์โหลดหนังสือรับรองได้',
        });
    }
};

/**
 * ส่งการแจ้งเตือนให้นักศึกษา
 */
const notifyStudent = async (req, res) => {
    try {
        const { studentId, type, status, certificateNumber, remarks } = req.body;

        // TODO: ส่งการแจ้งเตือนผ่านระบบ notification
        // สามารถใช้ email service หรือ in-app notification
        
        res.json({
            success: true,
            message: 'ส่งการแจ้งเตือนเรียบร้อยแล้ว',
        });
    } catch (error) {
        logger.error('Error sending notification:', error);
        res.status(500).json({
            success: false,
            message: 'ไม่สามารถส่งการแจ้งเตือนได้',
        });
    }
};

module.exports = {
    uploadDocument,
    getDocumentById,
    updateDocumentStatus,
    getDocuments,
    approveDocument,
    rejectDocument,
    searchDocuments,
    getRecentDocuments,
    viewDocument, // เพิ่มฟังก์ชัน viewDocument ที่นี่
    downloadDocument, // เพิ่มฟังก์ชัน downloadDocument ที่นี่

    // ✅ เพิ่มฟังก์ชันใหม่สำหรับ Certificate Management
    getCertificateRequests,
    approveCertificateRequest,
    rejectCertificateRequest,
    downloadCertificateForAdmin,
    notifyStudent,
};