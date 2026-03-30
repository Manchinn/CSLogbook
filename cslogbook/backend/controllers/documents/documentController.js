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

        // Ownership check — staff/admin/teacher ดูได้ทั้งหมด, student ดูได้เฉพาะของตัวเอง
        const staffRoles = ['admin', 'teacher', 'head', 'staff'];
        if (!staffRoles.includes(req.user.role) && documentData.userId !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'ไม่มีสิทธิ์เข้าถึงเอกสารนี้'
            });
        }

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
        const { type, status, search, academicYear, semester, limit, offset } = req.query;
        
        const filters = { 
            type, 
            status, 
            search,
            academicYear: academicYear ? parseInt(academicYear) : undefined,
            semester: semester ? parseInt(semester) : undefined
        };
        const pagination = { 
            limit: limit ? parseInt(limit) : 50, 
            offset: offset ? parseInt(offset) : 0 
        };
        
        const result = await documentService.getDocuments(filters, pagination, req.user.userId, req.user.role);
        
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

// รวมเอกสารฝึกงานทั้งหมดของนักศึกษา (CS05, ตอบรับ, ส่งตัว, รับรอง)
const getStudentDocumentsOverview = async (req, res) => {
    try {
        const documents = await documentService.getStudentDocumentsOverview(req.user.userId);
        res.json({ success: true, documents });
    } catch (error) {
        logger.error('Error fetching student documents overview:', error);
        res.status(500).json({ success: false, message: 'ไม่สามารถดึงข้อมูลเอกสารได้' });
    }
};

// ดึงเอกสารของผู้ใช้ที่ล็อกอิน (นักศึกษา)
const getMyDocuments = async (req, res) => {
    try {
        const userId = req.user.userId;
    const { type, lettersOnly } = req.query; // filter optional
    const documents = await documentService.getDocumentsByUser(userId, { type, lettersOnly });
        res.json({ success: true, documents });
    } catch (error) {
        logger.error('Error fetching my documents:', error);
        res.status(500).json({ success: false, message: 'ไม่สามารถดึงเอกสารของคุณได้' });
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
            message: 'ปฏิเสธเอกสารเรียบร้อยแล้ว',
            data: result
        });
    } catch (error) {
        logger.error('Error rejecting document:', error);

        if (error.message === 'ไม่พบเอกสาร') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        if (error.message === 'เอกสารนี้ถูกปฏิเสธแล้ว') {
            return res.status(400).json({
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
        const document = await documentService.validateDocumentFile(
            req.params.id, req.user.userId, req.user.role
        );

        // ตั้งค่า header สำหรับการแสดงไฟล์ PDF โดยตรงใน browser
        const fileName = document.fileName || path.basename(document.filePath);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileName)}"`);

        // อ่านและส่งไฟล์
        const fileStream = fs.createReadStream(document.filePath);
        fileStream.pipe(res);

    } catch (error) {
        logger.error('View Document Error:', error);

        if (error.message === 'ไม่มีสิทธิ์เข้าถึงเอกสารนี้') {
            return res.status(403).json({
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
        const document = await documentService.validateDocumentFile(
            req.params.id, req.user.userId, req.user.role
        );

        // ตั้งค่าการดาวน์โหลดไฟล์
        const fileName = document.fileName || path.basename(document.filePath);
        res.setHeader('Content-Type', document.mimeType || 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);

        // ส่งไฟล์
        const fileStream = fs.createReadStream(document.filePath);
        fileStream.pipe(res);

    } catch (error) {
        logger.error('Download Document Error:', error);

        if (error.message === 'ไม่มีสิทธิ์เข้าถึงเอกสารนี้') {
            return res.status(403).json({
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
        const { page, limit, status, studentId, academicYear, semester } = req.query;
        
        const filters = { 
            status, 
            studentId,
            academicYear: academicYear ? parseInt(academicYear) : undefined,
            semester: semester ? parseInt(semester) : undefined
        };
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

// ดึงรายละเอียดคำขอหนังสือรับรองเดียว
const getCertificateRequestDetail = async (req, res) => {
    try {
        const { requestId } = req.params;
        const detail = await documentService.getCertificateRequestDetail(requestId);
        res.json({ success: true, data: detail });
    } catch (error) {
        logger.error('Error fetching certificate request detail:', error);
        const statusCode = /ไม่พบ/.test(error.message) ? 404 : 500;
        res.status(statusCode).json({ success: false, message: error.message || 'ไม่สามารถดึงรายละเอียดคำขอได้' });
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

        if (!remarks || !remarks.trim()) {
            return res.status(400).json({ success: false, message: 'กรุณาระบุเหตุผลการปฏิเสธ' });
        }
        if (remarks.trim().length < 5 || remarks.trim().length > 1000) {
            return res.status(400).json({ success: false, message: 'เหตุผลการปฏิเสธต้องมีความยาว 5-1000 ตัวอักษร' });
        }

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

// Placeholder (ยังไม่ได้เปิดใช้ใน routes) สำหรับประวัติเอกสาร
const getDocumentHistory = async (req, res) => {
    return res.status(501).json({ success: false, message: 'ยังไม่ได้รองรับฟีเจอร์ประวัติเอกสาร' });
};

// Alias สำหรับความเข้ากันได้เดิม submitDocument -> uploadDocument
const submitDocument = (req, res, next) => uploadDocument(req, res, next);

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

// ---------------- Internship Summary (Admin) ----------------
const getInternshipSummary = async (req, res) => {
    try {
        const { internshipId } = req.params;
        const data = await documentService.getInternshipSummary(internshipId);
        res.json({ success: true, data });
    } catch (error) {
        logger.error('Error fetching internship summary:', error);
        const statusCode = /ไม่พบ/.test(error.message) ? 404 : 500;
        res.status(statusCode).json({ success: false, message: error.message || 'ไม่สามารถดึงสรุปได้' });
    }
};

// 🆕 Admin: JSON full logbook summary (entries + reflection + stats)
const getInternshipLogbookSummary = async (req, res) => {
    try {
        const { internshipId } = req.params;
        const { summaryFull } = await documentService.getInternshipLogbookSummary(internshipId, { pdf: false });
        res.json({ success: true, data: summaryFull });
    } catch (error) {
        logger.error('Error fetching internship logbook full summary:', error);
        const statusCode = /ไม่พบ/.test(error.message) ? 404 : 500;
        res.status(statusCode).json({ success: false, message: error.message || 'ไม่สามารถดึงข้อมูลสรุปบันทึกได้' });
    }
};

// 🆕 Admin: Preview PDF inline
const previewInternshipLogbookSummaryPDF = async (req, res) => {
    try {
        const { internshipId } = req.params;
        const { summaryFull, pdfBuffer } = await documentService.getInternshipLogbookSummary(internshipId, { pdf: true });
        const sid = summaryFull?.studentInfo?.studentId || internshipId;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="logbook-summary-' + sid + '.pdf"');
        res.send(pdfBuffer);
    } catch (error) {
        logger.error('Error previewing internship logbook summary PDF:', error);
        const statusCode = /ไม่พบ/.test(error.message) ? 404 : 500;
        res.status(statusCode).json({ success: false, message: error.message || 'ไม่สามารถแสดงตัวอย่าง PDF ได้' });
    }
};

// 🆕 Admin: Download PDF attachment
const downloadInternshipLogbookSummaryPDF = async (req, res) => {
    try {
        const { internshipId } = req.params;
        const { summaryFull, pdfBuffer } = await documentService.getInternshipLogbookSummary(internshipId, { pdf: true });
        const sid = summaryFull?.studentInfo?.studentId || internshipId;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="logbook-summary-' + encodeURIComponent(sid) + '.pdf"');
        res.send(pdfBuffer);
    } catch (error) {
        logger.error('Error downloading internship logbook summary PDF:', error);
        const statusCode = /ไม่พบ/.test(error.message) ? 404 : 500;
        res.status(statusCode).json({ success: false, message: error.message || 'ไม่สามารถดาวน์โหลด PDF ได้' });
    }
};

// ส่งออก XLSX รายการเอกสารฝึกงาน (admin)
const exportDocuments = async (req, res) => {
    try {
        const { type, status, search, academicYear, semester } = req.query;
        const filters = {
            type,
            status,
            search,
            academicYear: academicYear ? parseInt(academicYear) : undefined,
            semester: semester ? parseInt(semester) : undefined,
        };
        const result = await documentService.getDocuments(filters, { limit: 9999, offset: 0 }, null, req.user.role);
        const rows = Array.isArray(result?.documents) ? result.documents : [];

        const ExcelJS = require('exceljs');
        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet('เอกสารฝึกงาน');

        ws.columns = [
            { header: 'ลำดับ', key: 'order', width: 8 },
            { header: 'ประเภทเอกสาร', key: 'docType', width: 25 },
            { header: 'รหัสนักศึกษา', key: 'studentCode', width: 15 },
            { header: 'ชื่อ-นามสกุล', key: 'studentName', width: 30 },
            { header: 'บริษัท', key: 'company', width: 35 },
            { header: 'สถานะ', key: 'status', width: 15 },
            { header: 'เลขที่ อว.', key: 'officialNumber', width: 20 },
            { header: 'วันที่ส่ง', key: 'submittedAt', width: 20 },
        ];

        const docTypeLabel = {
            cs05: 'CS05',
            acceptance: 'ตอบรับ',
            delivery: 'ส่งตัว',
            certificate: 'หนังสือรับรอง',
            internship: 'ฝึกงาน',
            project: 'โครงงาน',
        };
        const statusLabel = {
            pending: 'รอดำเนินการ',
            approved: 'อนุมัติ',
            rejected: 'ปฏิเสธ',
        };

        rows.forEach((row, idx) => {
            ws.addRow({
                order: idx + 1,
                docType: docTypeLabel[row.type] || row.type || '-',
                studentCode: row.student_code || '-',
                studentName: row.student_name || '-',
                company: row.companyName || '-',
                status: statusLabel[row.status] || row.status || '-',
                officialNumber: row.officialNumber || row.official_number || '-',
                submittedAt: row.created_at || '-',
            });
        });

        ws.getRow(1).font = { bold: true };
        ws.eachRow(r => { r.alignment = { vertical: 'top', wrapText: true }; });

        const filename = `เอกสารฝึกงาน_${Date.now()}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
        await wb.xlsx.write(res);
        res.end();
    } catch (error) {
        logger.error('exportDocuments error', { error: error.message });
        if (res.headersSent) return;
        res.status(error.statusCode || 400).json({ success: false, message: error.message || 'ไม่สามารถส่งออกได้' });
    }
};

// ส่งออก XLSX คำขอหนังสือรับรอง (admin)
const exportCertificateRequests = async (req, res) => {
    try {
        const { status, studentId, academicYear, semester } = req.query;
        const filters = {
            status,
            studentId,
            academicYear: academicYear ? parseInt(academicYear) : undefined,
            semester: semester ? parseInt(semester) : undefined,
        };
        const result = await documentService.getCertificateRequests(filters, { page: 1, limit: 9999 });
        const rows = Array.isArray(result?.data) ? result.data : [];

        const ExcelJS = require('exceljs');
        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet('คำขอหนังสือรับรอง');

        ws.columns = [
            { header: 'ลำดับ', key: 'order', width: 8 },
            { header: 'รหัสนักศึกษา', key: 'studentCode', width: 15 },
            { header: 'ชื่อ-นามสกุล', key: 'fullName', width: 30 },
            { header: 'บริษัท', key: 'company', width: 35 },
            { header: 'ชั่วโมงฝึกงาน', key: 'totalHours', width: 15 },
            { header: 'คะแนนรวม', key: 'score', width: 15 },
            { header: 'สถานะ', key: 'status', width: 15 },
            { header: 'วันที่ขอ', key: 'requestedAt', width: 20 },
        ];

        const statusLabel = {
            pending: 'รอดำเนินการ',
            approved: 'อนุมัติ',
            rejected: 'ปฏิเสธ',
        };

        rows.forEach((row, idx) => {
            ws.addRow({
                order: idx + 1,
                studentCode: row.student?.studentCode || '-',
                fullName: row.student?.fullName || '-',
                company: row.internship?.companyName || '-',
                totalHours: row.totalHours ?? '-',
                score: row.totalScore ?? row.score ?? '-',
                status: statusLabel[row.status] || row.status || '-',
                requestedAt: row.requestDate || row.requestedAt || '-',
            });
        });

        ws.getRow(1).font = { bold: true };
        ws.eachRow(r => { r.alignment = { vertical: 'top', wrapText: true }; });

        const filename = `คำขอหนังสือรับรอง_${Date.now()}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
        await wb.xlsx.write(res);
        res.end();
    } catch (error) {
        logger.error('exportCertificateRequests error', { error: error.message });
        if (res.headersSent) return;
        res.status(error.statusCode || 400).json({ success: false, message: error.message || 'ไม่สามารถส่งออกได้' });
    }
};

module.exports = {
    uploadDocument,
    getDocumentById,
    updateDocumentStatus,
    getDocuments,
    exportDocuments,
    exportCertificateRequests,
    approveDocument,
    rejectDocument,
    searchDocuments,
    getRecentDocuments,
    viewDocument,
    downloadDocument,

    // ✅ เพิ่มฟังก์ชันใหม่สำหรับ Certificate Management
    getCertificateRequests,
    getCertificateRequestDetail,
    approveCertificateRequest,
    rejectCertificateRequest,
    downloadCertificateForAdmin,
    notifyStudent,
    getInternshipSummary,
    getInternshipLogbookSummary,
    previewInternshipLogbookSummaryPDF,
    downloadInternshipLogbookSummaryPDF,
    getMyDocuments,
    getStudentDocumentsOverview,
};