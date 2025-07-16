const { Op } = require('sequelize');
const fs = require('fs');
const { User, Student, Document, InternshipDocument, StudentWorkflowActivity, Notification } = require('../models');
const { UPLOAD_CONFIG } = require('../config/uploadConfig');
const logger = require('../utils/logger');
class DocumentService {
    /**
     * อัพโหลดเอกสารและบันทึกข้อมูลลงฐานข้อมูล
     */
    async uploadDocument(userId, fileData, documentData) {
        try {
            const { documentType, category } = documentData;

            // ตรวจสอบประเภทเอกสาร
            const docTypeConfig = UPLOAD_CONFIG.DOCUMENT_TYPES[documentType?.toUpperCase()];
            if (!docTypeConfig) {
                throw new Error('ประเภทเอกสารไม่ถูกต้อง');
            }

            // บันทึกข้อมูลลงฐานข้อมูล
            const document = await Document.create({
                userId,
                documentType,
                category,
                filePath: fileData.path,
                fileName: fileData.filename,
                mimeType: fileData.mimetype,
                fileSize: fileData.size,
                status: 'pending'
            });

            logger.info(`Document uploaded successfully: ${document.id} by user ${userId}`);

            return {
                documentId: document.id,
                fileUrl: `/uploads/${fileData.filename}`,
                message: 'อัปโหลดไฟล์สำเร็จ'
            };
        } catch (error) {
            logger.error('Error uploading document:', error);
            throw error;
        }
    }

    /**
     * ดึงข้อมูลเอกสารตาม ID พร้อมข้อมูลที่เกี่ยวข้อง
     */
    async getDocumentById(documentId, includeRelations = true) {
        try {
            if (!documentId) {
                throw new Error('ต้องระบุ ID ของเอกสาร');
            }

            // ดึงข้อมูล Document ก่อน
            const document = await Document.findOne({
                where: { documentId: documentId }
            });

            if (!document) {
                throw new Error('ไม่พบเอกสาร');
            }

            const documentData = document.toJSON();

            if (includeRelations) {
                // ดึงข้อมูลผู้ใช้ที่เกี่ยวข้อง
                if (document.userId) {
                    const user = await User.findOne({
                        where: { userId: document.userId },
                        include: [{
                            model: Student,
                            as: 'student',
                            attributes: ['studentId', 'studentCode', 'studentYear', 'totalCredits', 'majorCredits']
                        }]
                    });

                    if (user) {
                        documentData.owner = user.toJSON();
                    }
                }

                // ดึงข้อมูล InternshipDocument ที่เกี่ยวข้อง
                const internshipDocument = await InternshipDocument.findOne({
                    where: { documentId: documentId },
                    attributes: [
                        'internshipId', 'documentId', 'companyName',
                        'companyAddress', 'supervisorName', 'supervisorPosition',
                        'supervisorPhone', 'supervisorEmail', 'startDate', 'endDate',
                        'created_at', 'updated_at'
                    ]
                });

                if (internshipDocument) {
                    documentData.internshipDocument = internshipDocument.toJSON();
                }
            }

            logger.info(`Document retrieved: ${documentId}`);
            return documentData;
        } catch (error) {
            logger.error('Error getting document:', error);
            throw error;
        }
    }

    /**
     * อัพเดทสถานะเอกสาร
     */
    async updateDocumentStatus(documentId, status, reviewerId, comment = null) {
        try {
            const document = await Document.findByPk(documentId);

            if (!document) {
                throw new Error('ไม่พบเอกสาร');
            }

            await document.update({
                status,
                comment,
                reviewedBy: reviewerId,
                reviewedAt: new Date()
            });

            logger.info(`Document status updated: ${documentId} to ${status} by ${reviewerId}`);
            return { message: 'อัพเดทสถานะเอกสารสำเร็จ' };
        } catch (error) {
            logger.error('Error updating document status:', error);
            throw error;
        }
    }

    /**
     * ดึงข้อมูลเอกสารทั้งหมดพร้อม filter และ pagination
     */
    async getDocuments(filters = {}, pagination = {}) {
        try {
            const { type, status, search } = filters;
            const { limit = 50, offset = 0 } = pagination;

            // สร้าง query condition
            let whereCondition = {};

            if (type && type !== 'all') {
                whereCondition.documentType = type.toLowerCase();
            }

            if (status && status !== 'all') {
                whereCondition.status = status;
            }

            // ถ้ามี search ให้ค้นหาในชื่อเอกสารหรือชื่อนักศึกษา
            if (search) {
                whereCondition = {
                    ...whereCondition,
                    [Op.or]: [
                        { documentName: { [Op.like]: `%${search}%` } }
                    ]
                };
            }

            // ดึงข้อมูลเอกสารพร้อมข้อมูลที่เกี่ยวข้อง
            const documents = await Document.findAll({
                where: whereCondition,
                attributes: [
                    "documentId",
                    "documentName",
                    "documentType",
                    "status",
                    "created_at",
                    "updated_at"
                ],
                include: [
                    {
                        model: User,
                        as: 'owner',
                        attributes: ['firstName', 'lastName'],
                        include: [{
                            model: Student,
                            as: 'student',
                            attributes: ['studentCode']
                        }]
                    }
                ],
                order: [['created_at', 'DESC']],
                limit,
                offset
            });

            // นับสถิติ
            const statistics = await this.getDocumentStatistics();

            // จัดรูปแบบข้อมูลก่อนส่งกลับ
            const formattedDocuments = documents.map(doc => ({
                id: doc.id || doc.documentId,
                document_name: doc.documentName,
                student_name: `${doc.owner.firstName} ${doc.owner.lastName}`,
                student_code: doc.owner.student ? doc.owner.student.studentCode : '',
                type: doc.documentType.toLowerCase(),
                created_at: doc.created_at,
                updated_at: doc.updated_at,
                status: doc.status,
            }));

            logger.info(`Retrieved ${documents.length} documents with filters:`, filters);

            return {
                documents: formattedDocuments,
                statistics
            };
        } catch (error) {
            logger.error('Error fetching documents:', error);
            throw error;
        }
    }

    /**
     * อนุมัติเอกสาร
     */
    async approveDocument(documentId, reviewerId) {
        try {
            const document = await Document.findByPk(documentId, {
                include: [{
                    model: User,
                    as: 'owner',
                    include: [{
                        model: Student,
                        as: 'student'
                    }]
                }]
            });

            if (!document) {
                throw new Error('ไม่พบเอกสาร');
            }

            // อัปเดตสถานะเอกสาร
            await document.update({
                status: 'approved',
                reviewedBy: reviewerId,
                reviewedAt: new Date()
            });

            // ตรวจสอบว่าเป็นเอกสาร CS05 หรือไม่
            if (document.documentType === 'INTERNSHIP' && document.documentName === 'CS05') {
                logger.info(`Found CS05 document, processing workflow: ${document.id}`);
                await this.processCS05Approval(document, reviewerId);
            }

            logger.info(`Document approved: ${documentId} by ${reviewerId}`);
            return { message: 'อนุมัติเอกสารเรียบร้อยแล้ว' };
        } catch (error) {
            logger.error('Error approving document:', error);
            throw error;
        }
    }

    /**
     * ปฏิเสธเอกสาร
     */
    async rejectDocument(documentId, reviewerId, reason = null) {
        try {
            const document = await Document.findByPk(documentId);

            if (!document) {
                throw new Error('ไม่พบเอกสาร');
            }

            await document.update({
                status: 'rejected',
                comment: reason || 'ไม่ได้ระบุเหตุผล',
                reviewedBy: reviewerId,
                reviewedAt: new Date()
            });

            logger.info(`Document rejected: ${documentId} by ${reviewerId}`);
            return { message: 'ปฏิเสธเอกสารเรียบร้อยแล้ว' };
        } catch (error) {
            logger.error('Error rejecting document:', error);
            throw error;
        }
    }

    /**
     * ค้นหาเอกสาร
     */
    async searchDocuments(query, filters = {}) {
        try {
            const { type } = filters;

            if (!query) {
                return { documents: [] };
            }

            const whereCondition = {
                [Op.or]: [
                    { fileName: { [Op.like]: `%${query}%` } }
                ]
            };

            if (type && type !== 'all') {
                whereCondition.documentType = type;
            }

            const documents = await Document.findAll({
                where: whereCondition,
                limit: 20,
                order: [['createdAt', 'DESC']]
            });

            logger.info(`Search completed for query: ${query}, found ${documents.length} documents`);
            return { documents };
        } catch (error) {
            logger.error('Error searching documents:', error);
            throw error;
        }
    }

    /**
     * ดึงเอกสารล่าสุด
     */
    async getRecentDocuments(limit = 10) {
        try {
            const documents = await Document.findAll({
                limit,
                order: [['createdAt', 'DESC']]
            });

            logger.info(`Retrieved ${documents.length} recent documents`);
            return { documents };
        } catch (error) {
            logger.error('Error fetching recent documents:', error);
            throw error;
        }
    }

    /**
     * ตรวจสอบว่าไฟล์เอกสารมีอยู่จริง
     */
    async validateDocumentFile(documentId) {
        try {
            const document = await Document.findByPk(documentId);

            if (!document) {
                throw new Error('ไม่พบเอกสาร');
            }

            if (!document.filePath || !fs.existsSync(document.filePath)) {
                throw new Error('ไม่พบไฟล์เอกสาร');
            }

            return document;
        } catch (error) {
            logger.error('Error validating document file:', error);
            throw error;
        }
    }

    /**
     * ดึงสถิติเอกสาร
     */
    async getDocumentStatistics() {
        try {
            const [total, pending, approved, rejected] = await Promise.all([
                Document.count(),
                Document.count({ where: { status: 'pending' } }),
                Document.count({ where: { status: 'approved' } }),
                Document.count({ where: { status: 'rejected' } })
            ]);

            return { total, pending, approved, rejected };
        } catch (error) {
            logger.error('Error getting document statistics:', error);
            throw error;
        }
    }

    /**
     * จัดการ workflow สำหรับ CS05 ที่ได้รับการอนุมัติ
     */
    async processCS05Approval(document, adminId) {
        try {
            // อัปเดตสถานะนักศึกษา
            const student = await Student.findOne({
                include: [{
                    model: User,
                    as: 'user',
                    where: { userId: document.userId }
                }]
            });

            if (student) {
                await student.update({
                    internshipStatus: 'in_progress',
                    isEnrolledInternship: 1
                });
                logger.info(`Updated student ${student.studentId} internship status to in_progress`);
            }

            // อัปเดต workflow activity
            await this.updateInternshipWorkflow(document, adminId);

            // สร้างการแจ้งเตือน
            await this.createApprovalNotification(document);

        } catch (error) {
            logger.error('Error processing CS05 approval:', error);
            throw error;
        }
    }

    /**
     * อัปเดต workflow activity สำหรับ CS05
     */
    async updateInternshipWorkflow(document, adminId) {
        try {
            const studentId = document.owner?.student?.studentId;
            if (!studentId) {
                throw new Error('Cannot find studentId for document');
            }

            logger.info(`Updating workflow for student ${studentId}, document CS05`);

            // ค้นหากิจกรรม workflow ที่มีอยู่หรือสร้างใหม่
            let workflowActivity = await StudentWorkflowActivity.findOne({
                where: {
                    studentId,
                    workflowType: 'internship'
                }
            });

            if (!workflowActivity) {
                logger.info('Creating new workflow activity for student:', studentId);
                workflowActivity = await StudentWorkflowActivity.create({
                    studentId,
                    workflowType: 'internship',
                    currentStepKey: 'INTERNSHIP_CS05_APPROVAL_PENDING',
                    currentStepStatus: 'pending',
                    overallWorkflowStatus: 'enrolled',
                    dataPayload: {},
                    startedAt: new Date()
                });
            }

            // อัปเดตสถานะ
            await workflowActivity.update({
                currentStepKey: 'INTERNSHIP_CS05_APPROVED',
                previousStepKey: workflowActivity.currentStepKey,
                currentStepStatus: 'completed',
                overallWorkflowStatus: 'in_progress',
                dataPayload: {
                    ...workflowActivity.dataPayload,
                    cs05ApprovedAt: new Date().toISOString(),
                    cs05ApprovedBy: adminId,
                    documentId: document.id
                }
            });

            logger.info('CS05 workflow updated successfully');
            return workflowActivity;
        } catch (error) {
            logger.error('Error updating internship workflow:', error);
            throw error;
        }
    }

    /**
     * สร้างการแจ้งเตือนสำหรับการอนุมัติเอกสาร
     */
    async createApprovalNotification(document) {
        try {
            await Notification.create({
                userId: document.userId || document.owner?.userId,
                title: 'เอกสาร คพ.05 ได้รับการอนุมัติแล้ว',
                message: 'คำร้องขอฝึกงานของคุณได้รับการอนุมัติแล้ว โปรดดำเนินการขั้นตอนถัดไป',
                type: 'document_approved',
                referenceId: document.id,
                isRead: false
            });
            logger.info('Approval notification created for student');
        } catch (error) {
            logger.error('Error creating notification:', error);
            // ไม่ throw error เนื่องจากเป็น optional feature
        }
    }

    // ============= Certificate Management Services =============

    /**
     * ดึงรายการคำขอหนังสือรับรองทั้งหมด
     */
    async getCertificateRequests(filters = {}, pagination = {}) {
        try {
            const { status, studentId } = filters;
            const { page = 1, limit = 10 } = pagination;
            
            const whereClause = {};
            if (status) whereClause.status = status;
            if (studentId) whereClause.studentId = { [Op.like]: `%${studentId}%` };

            const { InternshipCertificateRequest } = require('../models');

            const requests = await InternshipCertificateRequest.findAndCountAll({
                where: whereClause,
                include: [
                    {
                        model: Student,
                        as: 'student',
                        attributes: ['studentId', 'studentCode'],
                        include: [
                            {
                                model: User,
                                as: 'user',
                                attributes: ['firstName', 'lastName'],
                            },
                        ],
                    },
                ],
                order: [['requestDate', 'DESC']],
                limit: parseInt(limit),
                offset: (parseInt(page) - 1) * parseInt(limit),
            });

            // เพิ่มข้อมูล fullName
            const formattedData = requests.rows.map(request => ({
                ...request.toJSON(),
                student: request.student ? {
                    ...request.student.toJSON(),
                    fullName: `${request.student.user.firstName} ${request.student.user.lastName}`,
                } : null,
            }));

            logger.info(`Retrieved ${requests.count} certificate requests`);

            return {
                data: formattedData,
                pagination: {
                    total: requests.count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(requests.count / parseInt(limit)),
                },
            };
        } catch (error) {
            logger.error('Error in getCertificateRequests service:', error);
            throw error;
        }
    }

    /**
     * อนุมัติคำขอหนังสือรับรอง
     */
    async approveCertificateRequest(requestId, processorId, certificateNumber = null) {
        try {
            const { InternshipCertificateRequest } = require('../models');

            const request = await InternshipCertificateRequest.findByPk(requestId);
            if (!request) {
                throw new Error('ไม่พบคำขอหนังสือรับรอง');
            }

            if (request.status !== 'pending') {
                throw new Error('คำขอนี้ได้รับการดำเนินการแล้ว');
            }

            // สร้างหมายเลขหนังสือรับรองอัตโนมัติ
            const generateCertificateNumber = () => {
                const year = new Date().getFullYear() + 543; // พ.ศ.
                const month = String(new Date().getMonth() + 1).padStart(2, '0');
                const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
                return `ว ${year}/${month}/${random}`;
            };

            // อัปเดตสถานะ
            await request.update({
                status: 'approved',
                certificateNumber: certificateNumber || generateCertificateNumber(),
                processedAt: new Date(),
                processedBy: processorId,
            });

            // สร้างการแจ้งเตือน
            await this.createCertificateApprovalNotification(request);

            logger.info(`Certificate request approved: ${requestId} by ${processorId}`);
            return request;
        } catch (error) {
            logger.error('Error in approveCertificateRequest service:', error);
            throw error;
        }
    }

    /**
     * ปฏิเสธคำขอหนังสือรับรอง
     */
    async rejectCertificateRequest(requestId, processorId, remarks = null) {
        try {
            const { InternshipCertificateRequest } = require('../models');

            const request = await InternshipCertificateRequest.findByPk(requestId);
            if (!request) {
                throw new Error('ไม่พบคำขอหนังสือรับรอง');
            }

            if (request.status !== 'pending') {
                throw new Error('คำขอนี้ได้รับการดำเนินการแล้ว');
            }

            // อัปเดตสถานะ
            await request.update({
                status: 'rejected',
                remarks: remarks || 'ไม่ผ่านเงื่อนไขการขอหนังสือรับรอง',
                processedAt: new Date(),
                processedBy: processorId,
            });

            // สร้างการแจ้งเตือน
            await this.createCertificateRejectionNotification(request, remarks);

            logger.info(`Certificate request rejected: ${requestId} by ${processorId}`);
            return request;
        } catch (error) {
            logger.error('Error in rejectCertificateRequest service:', error);
            throw error;
        }
    }

    /**
     * สร้าง PDF หนังสือรับรอง
     */
    async generateCertificatePDF(requestId) {
        try {
            const { InternshipCertificateRequest } = require('../models');

            const request = await InternshipCertificateRequest.findByPk(requestId, {
                include: [
                    { 
                        model: Student, 
                        as: 'student',
                        include: [
                            {
                                model: User,
                                as: 'user',
                                attributes: ['firstName', 'lastName'],
                            },
                        ],
                    },
                ],
            });

            if (!request) {
                throw new Error('ไม่พบคำขอหนังสือรับรอง');
            }

            if (request.status !== 'approved') {
                throw new Error('คำขอยังไม่ได้รับการอนุมัติ');
            }

            // เตรียมข้อมูลสำหรับสร้าง PDF
            const certificateData = {
                certificateNumber: request.certificateNumber,
                studentName: `${request.student.user.firstName} ${request.student.user.lastName}`,
                studentId: request.student.studentCode,
                totalHours: request.totalHours,
                startDate: request.startDate,
                endDate: request.endDate,
                issueDate: request.processedAt,
            };

            // ใช้ PDF service ที่มีอยู่แล้ว
            const pdfBuffer = await this.generatePDFFromTemplate('certificate', certificateData);
            
            logger.info(`Certificate PDF generated for request: ${requestId}`);
            return pdfBuffer;
        } catch (error) {
            logger.error('Error in generateCertificatePDF service:', error);
            throw error;
        }
    }

    /**
     * ส่งการแจ้งเตือนการอนุมัติ
     */
    async createCertificateApprovalNotification(request) {
        try {
            await Notification.create({
                userId: request.requestedBy,
                title: 'หนังสือรับรองการฝึกงานได้รับการอนุมัติแล้ว',
                message: `หนังสือรับรองการฝึกงานหมายเลข ${request.certificateNumber} ได้รับการอนุมัติแล้ว สามารถดาวน์โหลดได้ที่หน้าสถานะการฝึกงาน`,
                type: 'certificate_approved',
                referenceId: request.id,
                isRead: false
            });
            logger.info('Certificate approval notification created');
        } catch (error) {
            logger.error('Error creating certificate approval notification:', error);
            // ไม่ throw error เนื่องจากเป็น optional feature
        }
    }

    /**
     * ส่งการแจ้งเตือนการปฏิเสธ
     */
    async createCertificateRejectionNotification(request, remarks) {
        try {
            await Notification.create({
                userId: request.requestedBy,
                title: 'หนังสือรับรองการฝึกงานถูกปฏิเสธ',
                message: `คำขอหนังสือรับรองการฝึกงานของคุณถูกปฏิเสธ เหตุผล: ${remarks || 'ไม่ระบุเหตุผล'}`,
                type: 'certificate_rejected',
                referenceId: request.id,
                isRead: false
            });
            logger.info('Certificate rejection notification created');
        } catch (error) {
            logger.error('Error creating certificate rejection notification:', error);
            // ไม่ throw error เนื่องจากเป็น optional feature
        }
    }

    /**
     * Helper function สำหรับสร้าง PDF จาก template
     */
    async generatePDFFromTemplate(templateType, data) {
        try {
            // TODO: ใช้ระบบ PDF generation ที่มีอยู่แล้ว
            // เรียกใช้ PDF service จาก templates folder
            
            // Placeholder สำหรับตอนนี้
            const pdfContent = this.createCertificatePDFContent(data);
            return Buffer.from(pdfContent);
        } catch (error) {
            logger.error('Error generating PDF from template:', error);
            throw error;
        }
    }

    /**
     * สร้างเนื้อหา PDF หนังสือรับรอง (placeholder)
     */
    createCertificatePDFContent(data) {
        // TODO: ใช้ PDF template system ที่มีอยู่
        return `
        หนังสือรับรองการฝึกงาน
        หมายเลข: ${data.certificateNumber}
        
        ขอรับรองว่า ${data.studentName} รหัสนักศึกษา ${data.studentId}
        ได้เข้าร่วมการฝึกงานครบ ${data.totalHours} ชั่วโมง
        ตั้งแต่วันที่ ${data.startDate} ถึง ${data.endDate}
        
        ออกให้ ณ วันที่ ${data.issueDate}
        `;
    }
}

module.exports = new DocumentService();
