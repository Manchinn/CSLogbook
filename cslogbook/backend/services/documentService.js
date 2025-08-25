const { Op } = require('sequelize');
const fs = require('fs');
const { User, Student, Document, InternshipDocument, StudentWorkflowActivity, Notification, DocumentLog } = require('../models');
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
                            attributes: ['studentId', 'studentCode', 'totalCredits', 'majorCredits']
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
                reviewerId: reviewerId,
                reviewDate: new Date()
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

            // สร้าง query condition พื้นฐาน
            let whereCondition = {};

            if (type && type !== 'all') {
                whereCondition.documentType = type.toLowerCase();
            }

            if (status && status !== 'all') {
                whereCondition.status = status;
            }

            // ถ้ามี search ให้ค้นหาหลายเขตข้อมูล (ชื่อเอกสาร + ชื่อนักศึกษา + รหัส)
            if (search) {
                const like = { [Op.like]: `%${search}%` };
                // ใช้ชื่อคอลัมน์จริง (snake_case) ภายใน path $alias.field$ เพื่อหลีกเลี่ยง error Unknown column
                whereCondition = {
                    ...whereCondition,
                    [Op.or]: [
                        { documentName: like },
                        { '$owner.first_name$': like },
                        { '$owner.last_name$': like },
                        { '$owner->student.student_code$': like }
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
            "reviewerId",
            "reviewDate",
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
                reviewerId: doc.reviewerId || null,
                reviewDate: doc.reviewDate || null,
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
     * ดึงเอกสารของผู้ใช้ตาม userId (สำหรับนักศึกษาเห็นของตนเอง)
     * @param {number} userId
     * @param {object} options { type?: string }
     */
    async getDocumentsByUser(userId, options = {}) {
        try {
            const { type, lettersOnly } = options;
            const where = { userId };
            if (type && type !== 'all') {
                where.documentType = type.toLowerCase();
            }
            const rows = await Document.findAll({
                where,
                attributes: [
                    'documentId','documentName','documentType','status','filePath','fileSize','mimeType','created_at','updated_at','reviewDate','reviewComment'
                ],
                order: [['created_at','DESC']]
            });
            let list = rows;
            if (lettersOnly) {
                const allow = new Set(['REQUEST_LETTER','ACCEPTANCE_LETTER','REFERRAL_LETTER']);
                // แสดงเฉพาะที่มีอยู่จริงและอนุมัติแล้ว ไม่ auto-create อีกต่อไป
                list = rows.filter(r => allow.has((r.documentName||'').toUpperCase()) && r.status === 'approved');
            }
            return list.map(r => ({
                id: r.documentId,
                documentId: r.documentId,
                name: r.documentName,
                type: r.documentType,
                status: r.status,
                filePath: r.filePath,
                fileName: r.filePath ? require('path').basename(r.filePath) : null, // สร้างจาก path แทน (ไม่มีคอลัมน์ fileName)
                fileSize: r.fileSize,
                mimeType: r.mimeType,
                createdAt: r.created_at,
                updatedAt: r.updated_at,
                reviewDate: r.reviewDate,
                reviewComment: r.reviewComment,
            }));
        } catch (error) {
            logger.error('Error in getDocumentsByUser:', error);
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

            // ถ้าเป็นเอกสาร CS05: แปลงการ "approve" บน admin route ให้เป็น "review โดยเจ้าหน้าที่ภาค"
            // เพื่อส่งต่อหัวหน้าภาค (ไม่ตั้ง approved ที่นี่)
            if (document.documentType === 'INTERNSHIP' && document.documentName === 'CS05') {
                const prevStatus = document.status;
                if (!['draft', 'pending'].includes(prevStatus)) {
                    const err = new Error(`ไม่สามารถตรวจสอบได้ เนื่องจากสถานะปัจจุบันคือ ${prevStatus}`);
                    err.statusCode = 400;
                    throw err;
                }

                await document.update({
                    status: 'pending',
                    reviewerId: reviewerId,
                    reviewDate: new Date()
                });

                // บันทึก Log การตรวจสอบ
                try {
                    await DocumentLog.create({
                        documentId: document.documentId,
                        userId: reviewerId,
                        actionType: 'update',
                        previousStatus: prevStatus,
                        newStatus: 'pending',
                        comment: 'ตรวจสอบโดยเจ้าหน้าที่ภาค (ผ่านหน้าผู้ดูแล)'
                    });
                } catch (logErr) {
                    logger.warn('Unable to create DocumentLog for CS05 review via admin route:', logErr.message);
                }

                logger.info(`CS05 reviewed by staff via admin route: ${documentId} by ${reviewerId}`);
                return { message: 'ตรวจสอบเอกสารแล้ว และรอหัวหน้าภาคอนุมัติ' };
            }

            // อัปเดตสถานะเอกสาร (ทั่วไป)
            await document.update({
                status: 'approved',
                reviewerId: reviewerId,
                reviewDate: new Date()
            });

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

            // บันทึกเหตุผลลง reviewComment (คอลัมน์จริงในตาราง documents)
            await document.update({
                status: 'rejected',
                reviewComment: reason || 'ไม่ได้ระบุเหตุผล',
                reviewerId: reviewerId,
                reviewDate: new Date()
            });

            logger.info(`Document rejected: ${documentId} by ${reviewerId}`);
            return { 
                message: 'ปฏิเสธเอกสารเรียบร้อยแล้ว',
                reviewComment: document.reviewComment
            };
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
     * ดึงรายละเอียดคำขอหนังสือรับรองเดียว (สำหรับ Admin ตรวจสอบก่อนอนุมัติ)
     * รวม: นักศึกษา, การฝึกงาน (เบื้องต้น), eligibility snapshot, evaluation (ถ้ามี)
     */
    async getCertificateRequestDetail(requestId) {
        try {
            const { InternshipCertificateRequest, Internship, InternshipEvaluation, InternshipDocument } = require('../models');

            const request = await InternshipCertificateRequest.findByPk(requestId, {
                include: [
                    {
                        model: Student,
                        as: 'student',
                        attributes: ['studentId', 'studentCode', 'phoneNumber'],
                        include: [
                            { model: User, as: 'user', attributes: ['firstName', 'lastName', 'email'] }
                        ]
                    },
                ]
            });
            if (!request) throw new Error('ไม่พบคำขอหนังสือรับรอง');

            // ดึงข้อมูล internship หลัก + รายละเอียดจาก internship_documents
            let internshipInfo = null;
            let internshipDoc = null; // จากตาราง internship_documents (InternshipDocument model)
            try {
                if (Internship && request.internshipId) {
                    internshipInfo = await Internship.findByPk(request.internshipId);
                }
            } catch (e) {
                logger.warn('ไม่สามารถดึงข้อมูล Internship เพิ่มเติม:', e.message);
            }
            try {
                if (InternshipDocument && request.internshipId) {
                    internshipDoc = await InternshipDocument.findOne({ where: { internshipId: request.internshipId } });
                }
            } catch (e) {
                logger.warn('ไม่สามารถดึงข้อมูล InternshipDocument:', e.message);
            }

            // ดึงข้อมูลการประเมินล่าสุดจาก InternshipEvaluation
            let evaluationRecord = null;
            try {
                if (InternshipEvaluation) {
                    evaluationRecord = await InternshipEvaluation.findOne({
                        where: { studentId: request.studentId },
                        order: [['evaluationDate', 'DESC']],
                    });
                }
            } catch (e) {
                logger.warn('ไม่สามารถดึงข้อมูลการประเมิน (InternshipEvaluation):', e.message);
            }

            const overallScore = evaluationRecord?.overallScore != null ? Number(evaluationRecord.overallScore) : null;
            const passScore = 70; // ปรับเป็น 70 ตามเกณฑ์ที่ระบบใช้ (TODO: ย้ายไป config ภายหลัง)
            let evaluationPassed = false;
            if (typeof overallScore === 'number') {
                evaluationPassed = overallScore >= passScore;
            } else if (evaluationRecord?.passFail) {
                evaluationPassed = evaluationRecord.passFail.toLowerCase() === 'pass';
            } else if (evaluationRecord?.supervisorPassDecision != null) {
                evaluationPassed = !!evaluationRecord.supervisorPassDecision;
            } else {
                evaluationPassed = request.evaluationStatus === 'completed';
            }

            // สร้าง breakdown จาก evaluationItems หรือคะแนนหมวด
            let breakdown = [];
            try {
                if (evaluationRecord?.evaluationItems) {
                    const parsed = JSON.parse(evaluationRecord.evaluationItems);
                    if (Array.isArray(parsed)) {
                        const categoryLabels = {
                            discipline: 'วินัยและความรับผิดชอบ',
                            behavior: 'พฤติกรรมและการปฏิบัติตน',
                            performance: 'ผลงาน / คุณภาพงาน',
                            method: 'วิธีการ / ทักษะการทำงาน',
                            relation: 'มนุษยสัมพันธ์ / การทำงานร่วมกัน'
                        };
                        const categoryCounts = {};
                        breakdown = parsed.map((it, idx) => {
                            const catKey = it.category || 'misc';
                            categoryCounts[catKey] = (categoryCounts[catKey] || 0) + 1;
                            const sequence = categoryCounts[catKey];
                            const base = categoryLabels[it.category] || it.category || `หัวข้อที่ ${idx+1}`;
                            const label = it.label || (sequence > 1 ? `${base} (#${sequence})` : base);
                            const score = it.score != null ? Number(it.score) : null;
                            const max = it.max != null ? Number(it.max) : null;
                            let percent = null;
                            if (typeof score === 'number' && typeof max === 'number' && max > 0) {
                                percent = Number(((score / max) * 100).toFixed(2));
                            }
                            return {
                                key: it.id || (it.category ? `${it.category}-${it.item || idx}` : `item-${idx}`),
                                label,
                                category: it.category || null,
                                categoryLabel: base,
                                index: idx + 1,
                                sequence, // ลำดับภายในหมวด
                                score,
                                max,
                                percent,
                                weight: it.weight != null ? Number(it.weight) : null,
                                comment: it.comment || it.notes || null,
                                raw: it // เก็บ raw เผื่อ debug ภายหลัง
                            };
                        });
                    }
                } else if (
                    evaluationRecord && (
                        evaluationRecord.disciplineScore != null ||
                        evaluationRecord.behaviorScore != null ||
                        evaluationRecord.performanceScore != null ||
                        evaluationRecord.methodScore != null ||
                        evaluationRecord.relationScore != null
                    )
                ) {
                    const cat = (label, field, key) => evaluationRecord[field] != null ? ({ key, label, score: Number(evaluationRecord[field]), max: null }) : null;
                    breakdown = [
                        cat('วินัยและความรับผิดชอบ', 'disciplineScore', 'discipline'),
                        cat('พฤติกรรมและการปฏิบัติตน', 'behaviorScore', 'behavior'),
                        cat('ผลงาน / คุณภาพงาน', 'performanceScore', 'performance'),
                        cat('วิธีการ / ทักษะการทำงาน', 'methodScore', 'method'),
                        cat('มนุษยสัมพันธ์ / การทำงานร่วมกัน', 'relationScore', 'relation'),
                    ].filter(Boolean);
                }
            } catch (e) {
                logger.warn('แปลง evaluationItems ล้มเหลว:', e.message);
            }

            const fullName = request.student ? `${request.student.user.firstName} ${request.student.user.lastName}` : null;

            const detail = {
                id: request.id,
                status: request.status,
                requestDate: request.requestDate,
                certificateNumber: request.certificateNumber,
                student: {
                    studentId: request.student?.studentId,
                    studentCode: request.student?.studentCode,
                    fullName,
                    email: request.student?.user?.email || null,
                    phone: request.student?.phoneNumber || null,
                    internshipPosition: internshipDoc?.internshipPosition || null, // ตำแหน่งที่ฝึกงาน
                },
                internship: {
                    companyName: internshipDoc?.companyName || internshipInfo?.companyName || null,
                    location: internshipDoc?.companyAddress || internshipInfo?.province || null, // ใช้ address เป็นที่ตั้ง
                    startDate: internshipDoc?.startDate || internshipInfo?.startDate || null,
                    endDate: internshipDoc?.endDate || internshipInfo?.endDate || null,
                    totalHours: request.totalHours,
                    internshipId: request.internshipId || internshipDoc?.internshipId || null,
                },
                eligibility: {
                    hours: { current: Number(request.totalHours), required: 240, passed: Number(request.totalHours) >= 240 },
                    evaluation: {
                        status: request.evaluationStatus,
                        overallScore,
                        passScore,
                        passed: evaluationPassed
                    },
                    // summary เดิม (JSON) เปลี่ยนใช้สำหรับตรวจว่าพร้อมสร้าง PDF หรือไม่
                    summary: { available: request.summaryStatus === 'submitted' }
                },
                evaluationDetail: {
                    overallScore,
                    passScore,
                    passed: evaluationPassed,
                    submittedAt: evaluationRecord?.evaluationDate || null,
                    updatedAt: evaluationRecord?.updated_at || null,
                    evaluatorName: evaluationRecord?.evaluatorName || null,
                    strengths: evaluationRecord?.strengths || null,
                    weaknessesToImprove: evaluationRecord?.weaknessesToImprove || null,
                    additionalComments: evaluationRecord?.additionalComments || null,
                    breakdown
                }
            };

            return detail;
        } catch (error) {
            logger.error('Error in getCertificateRequestDetail service:', error);
            throw error;
        }
    }

    /**
     * ดึงสรุปภาพรวมการฝึกงาน (summary) สำหรับ admin
     */
    async getInternshipSummary(internshipId) {
        try {
            const { Internship, InternshipEvaluation, InternshipCertificateRequest } = require('../models');
            const internship = Internship ? await Internship.findByPk(internshipId) : null;
            if (!internship) throw new Error('ไม่พบข้อมูลการฝึกงาน');

            // ดึง evaluation ล่าสุด
            let evaluation = null;
            if (InternshipEvaluation) {
                evaluation = await InternshipEvaluation.findOne({ where: { internshipId }, order: [['evaluationDate', 'DESC']] });
            }
            let breakdown = [];
            if (evaluation?.evaluationItems) {
                try {
                    const parsed = JSON.parse(evaluation.evaluationItems);
                    if (Array.isArray(parsed)) {
                        breakdown = parsed.map((it, idx) => ({
                            key: it.category ? `${it.category}-${idx}` : `item-${idx}`,
                            category: it.category || null,
                            label: it.label || it.category || `หัวข้อที่ ${idx+1}`,
                            score: it.score ?? null,
                            max: it.max ?? null,
                        }));
                    }
                } catch (e) {}
            }

            // หา certificate request ล่าสุดเพื่อดึง totalHours
            let certificateReq = null;
            if (InternshipCertificateRequest) {
                certificateReq = await InternshipCertificateRequest.findOne({ where: { internshipId }, order: [['requestDate','DESC']] });
            }

            return {
                internshipId,
                companyName: internship.companyName || null,
                period: { startDate: internship.startDate, endDate: internship.endDate },
                totalHours: certificateReq?.totalHours || null,
                evaluation: evaluation ? {
                    overallScore: evaluation.overallScore,
                    evaluatorName: evaluation.evaluatorName,
                    evaluationDate: evaluation.evaluationDate,
                    passed: evaluation.passFail ? evaluation.passFail.toLowerCase() === 'pass' : null,
                    strengths: evaluation.strengths,
                    weaknessesToImprove: evaluation.weaknessesToImprove,
                    additionalComments: evaluation.additionalComments,
                    breakdown
                } : null,
                updatedAt: new Date()
            };
        } catch (error) {
            logger.error('Error in getInternshipSummary service:', error);
            throw error;
        }
    }

    /**
     * 🆕 ดึงข้อมูล summary logbook (full) + buffer PDF (เลือกได้) สำหรับ admin
     * @param {number} internshipId
     * @param {object} options { pdf?: boolean }
     */
    async getInternshipLogbookSummary(internshipId, options = {}) {
        const { pdf = false } = options;
        try {
            const summaryFull = await require('./internshipLogbookService').getInternshipSummaryByInternshipId(internshipId);
            if (!summaryFull) throw new Error('ไม่พบข้อมูลสรุปบันทึกฝึกงาน');
            let pdfBuffer = null;
            if (pdf) {
                pdfBuffer = await require('./internshipLogbookService').generateInternshipSummaryPDF(summaryFull);
            }
            return { summaryFull, pdfBuffer };
        } catch (error) {
            logger.error('Error in getInternshipLogbookSummary service:', error);
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
