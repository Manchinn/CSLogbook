const { Op } = require('sequelize');
const fs = require('fs');
const {
    User,
    Student,
    Document,
    InternshipDocument,
    StudentWorkflowActivity,
    Notification,
    DocumentLog,
    ProjectDocument,
    ProjectExamResult,
    ProjectMember
} = require('../models');
const { UPLOAD_CONFIG } = require('../config/uploadConfig');
const logger = require('../utils/logger');
const { getCurrentAcademicYear } = require('../utils/studentUtils');
const notificationService = require('./notificationService');
const projectDocumentService = require('./projectDocumentService');
const deadlineAutoAssignService = require('./deadlineAutoAssignService');

const FINAL_DOCUMENT_ACCEPTED_STATUSES = new Set([
    'approved',
    'completed',
    'supervisor_evaluated',
    'acceptance_approved',
    'referral_ready',
    'referral_downloaded'
]);
class DocumentService {
    /**
     * อัพโหลดเอกสารและบันทึกข้อมูลลงฐานข้อมูล
     */
    async uploadDocument(userId, fileData, documentData) {
        try {
            const { documentType, category, importantDeadlineId, documentName } = documentData;

            // ตรวจสอบประเภทเอกสาร
            const docTypeConfig = UPLOAD_CONFIG.DOCUMENT_TYPES[documentType?.toUpperCase()];
            if (!docTypeConfig) {
                throw new Error('ประเภทเอกสารไม่ถูกต้อง');
            }

            // ดึงข้อมูล deadline (ถ้าระบุ) เพื่อตรวจ policy + คำนวณ late
            let deadlineRecord = null;
            if (importantDeadlineId) {
                const { ImportantDeadline } = require('../models');
                deadlineRecord = await ImportantDeadline.findByPk(importantDeadlineId);
                if (!deadlineRecord) throw new Error('ไม่พบกำหนดการอ้างอิง');
                // ตรวจ policy การรับ
                if (!deadlineRecord.acceptingSubmissions) throw new Error('กำหนดการนี้ปิดรับการส่ง');
            }

            const submittedAt = new Date();
            let isLate = false; let lateMinutes = null;
            let dueDate = null;
            if (deadlineRecord) {
                // --- NEW LATE LOGIC (สอดคล้องสเปก Important Deadlines) ---
                // effectiveDeadlineAt = windowEndAt || deadlineAt || (date legacy 23:59:59)
                let effectiveDeadlineAt = null;
                if (deadlineRecord.windowEndAt) {
                    effectiveDeadlineAt = new Date(deadlineRecord.windowEndAt);
                } else if (deadlineRecord.deadlineAt) {
                    effectiveDeadlineAt = new Date(deadlineRecord.deadlineAt);
                } else if (deadlineRecord.date) {
                    effectiveDeadlineAt = new Date(`${deadlineRecord.date}T23:59:59+07:00`);
                }

                // เก็บ effectiveDeadlineAt ลง dueDate (เปลี่ยนความหมายเดิมที่เคยบวก grace) เพื่อให้ใช้ตรวจ isLate ภายหลังได้ตรง
                dueDate = effectiveDeadlineAt ? new Date(effectiveDeadlineAt) : null;

                // graceEnd = effective + gracePeriod (ถ้า allowLate และมี minute) มิฉะนั้น = effective
                let graceEnd = effectiveDeadlineAt;
                if (effectiveDeadlineAt && deadlineRecord.allowLate && deadlineRecord.gracePeriodMinutes) {
                    graceEnd = new Date(effectiveDeadlineAt.getTime() + deadlineRecord.gracePeriodMinutes * 60000);
                }

                if (effectiveDeadlineAt) {
                    if (submittedAt > effectiveDeadlineAt) {
                        // 🆕 Google Classroom Style: อนุญาตให้ส่งเสมอ แต่ track ว่าสาย
                        // ยกเว้นกรณีที่ acceptingSubmissions = false (ปิดรับเอกสารโดยสิ้นเชิง)
                        if (!deadlineRecord.acceptingSubmissions) {
                            throw new Error('ปิดรับเอกสารแล้ว (accepting_submissions = false)');
                        }

                        // คำนวณว่าส่งช้ากี่นาที
                        isLate = true;
                        lateMinutes = Math.ceil((submittedAt - effectiveDeadlineAt) / 60000);
                        
                        // Log สำหรับ monitoring
                        logger.warn('[DocumentService] Late submission detected', {
                            documentType,
                            category,
                            deadlineName: deadlineRecord.name,
                            effectiveDeadline: effectiveDeadlineAt.toISOString(),
                            submittedAt: submittedAt.toISOString(),
                            delayMinutes: lateMinutes
                        });
                    }
                }
            }

            // 🆕 Auto-assign deadline ถ้ายังไม่ระบุมา
            let finalDeadlineId = importantDeadlineId;
            if (!finalDeadlineId) {
                try {
                    // ดึงข้อมูล student เพื่อหา academicYear, semester
                    const student = await Student.findOne({ where: { userId } });
                    const autoDeadlineId = await deadlineAutoAssignService.findMatchingDeadline({
                        documentType,
                        category,
                        academicYear: student?.currentAcademicYear,
                        semester: student?.currentSemester
                    });
                    if (autoDeadlineId) {
                        finalDeadlineId = autoDeadlineId;
                        logger.info(`[DocumentService] Auto-assigned deadline ${autoDeadlineId} to document`);
                    }
                } catch (autoError) {
                    logger.warn('[DocumentService] Auto-assign deadline failed:', autoError.message);
                }
            }

            // ตรวจสอบว่ามีเอกสารประเภทเดียวกันที่ถูก reject อยู่หรือไม่ — ถ้ามี ให้ resubmit โดยอัปเดตเอกสารเดิม
            const resolvedDocName = documentName || (fileData?.originalname) || fileData?.filename || 'unnamed';
            const rejectedDocument = await Document.findOne({
                where: {
                    userId,
                    documentType,
                    category,
                    documentName: resolvedDocName,
                    status: 'rejected',
                },
                order: [['created_at', 'DESC']],
            });

            let document;
            if (rejectedDocument) {
                // --- Resubmit: อัปเดตเอกสารเดิมที่ถูก reject เพื่อเก็บ audit trail ---
                try {
                    await DocumentLog.create({
                        documentId: rejectedDocument.documentId,
                        userId: userId,
                        actionType: 'update',
                        previousStatus: 'rejected',
                        newStatus: 'pending',
                        comment: 'นักศึกษาส่งเอกสารใหม่หลังถูกปฏิเสธ (resubmit)'
                    });
                } catch (logErr) {
                    logger.warn('Unable to create DocumentLog for resubmission:', logErr.message);
                }

                await rejectedDocument.update({
                    filePath: fileData.path,
                    fileName: fileData.filename,
                    mimeType: fileData.mimetype,
                    fileSize: fileData.size,
                    status: 'pending',
                    importantDeadlineId: finalDeadlineId || null,
                    submittedAt,
                    isLate,
                    lateMinutes,
                    dueDate: dueDate || null,
                    submittedLate: isLate,
                    submissionDelayMinutes: lateMinutes,
                    reviewerId: null,
                    reviewDate: null,
                });

                document = rejectedDocument;
                logger.info(`Document resubmitted (updated existing ${document.documentId}) by user ${userId}`);
            } else {
                // --- First-time submission: สร้างเอกสารใหม่ ---
                document = await Document.create({
                    userId,
                    documentType,
                    category,
                    documentName: resolvedDocName,
                    filePath: fileData.path,
                    fileName: fileData.filename,
                    mimeType: fileData.mimetype,
                    fileSize: fileData.size,
                    status: 'pending',
                    importantDeadlineId: finalDeadlineId || null,
                    submittedAt,
                    isLate,
                    lateMinutes,
                    dueDate: dueDate || null,
                    submittedLate: isLate,
                    submissionDelayMinutes: lateMinutes
                });

                logger.info(`Document uploaded successfully: ${document.id} by user ${userId}`);
            }

            return {
                documentId: document.documentId || document.id,
                fileUrl: `/uploads/${fileData.filename}`,
                message: rejectedDocument ? 'ส่งเอกสารใหม่สำเร็จ' : 'อัปโหลดไฟล์สำเร็จ',
                isLate,
                lateMinutes
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

            // คำนวณ late (เผื่อ backend ต้องการส่งซ้ำ) หากมี dueDate และ submittedAt
            if (documentData.submitted_at && documentData.due_date && documentData.is_late === false) {
                const sub = new Date(documentData.submitted_at);
                const due = new Date(documentData.due_date);
                if (sub > due) {
                    documentData.computedLate = true;
                }
            }

            // fallback วันที่ส่ง: ใช้ created_at เมื่อ submitted_at เป็น null
            if (!documentData.submittedAt && documentData.created_at) {
                documentData.submittedAt = documentData.created_at;
            }

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
                let internshipDocument = await InternshipDocument.findOne({
                    where: { documentId: documentId },
                    attributes: [
                        'internshipId', 'documentId', 'companyName',
                        'companyAddress', 'internshipPosition', 'contactPersonName', 'contactPersonPosition',
                        'supervisorName', 'supervisorPosition',
                        'supervisorPhone', 'supervisorEmail', 'startDate', 'endDate',
                        'created_at', 'updated_at'
                    ]
                });

                // ACCEPTANCE_LETTER ไม่มี InternshipDocument ของตัวเอง — ดึงจาก CS05 ของ user เดียวกัน
                if (!internshipDocument && document.documentType === 'INTERNSHIP' && document.userId) {
                    const cs05Doc = await Document.findOne({
                        where: {
                            userId: document.userId,
                            documentType: 'INTERNSHIP',
                            documentName: 'CS05'
                        },
                        attributes: ['documentId']
                    });
                    if (cs05Doc) {
                        internshipDocument = await InternshipDocument.findOne({
                            where: { documentId: cs05Doc.documentId },
                            attributes: [
                                'internshipId', 'documentId', 'companyName',
                                'companyAddress', 'internshipPosition', 'contactPersonName', 'contactPersonPosition',
                                'supervisorName', 'supervisorPosition',
                                'supervisorPhone', 'supervisorEmail', 'startDate', 'endDate',
                                'created_at', 'updated_at'
                            ]
                        });
                    }
                }

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
     * อัพเดทสถานะเอกสาร (พร้อม transaction และ DocumentLog)
     */
    async updateStatus(documentId, status, comment, userId) {
        const { sequelize } = require('../config/database');
        const transaction = await sequelize.transaction();
        try {
            const document = await Document.findByPk(documentId);

            if (!document) {
                throw new Error('ไม่พบเอกสาร');
            }

            const oldStatus = document.status;

            // อัพเดทสถานะ
            await document.update({
                status,
                reviewerId: userId,
                reviewDate: new Date(),
                reviewComment: comment
            }, { transaction });

            // บันทึก Log
            await DocumentLog.create({
                documentId: documentId,
                userId: userId,
                actionType: status === 'approved' ? 'approve' : 'reject',
                previousStatus: oldStatus,
                newStatus: status,
                comment
            }, { transaction });

            await transaction.commit();

            // Sync project completion (outside transaction)
            await this._syncProjectCompletionFromDocument(document);

            logger.info(`Document status updated: ${documentId} to ${status} by ${userId}`);
            return {
                success: true,
                message: 'อัพเดทสถานะเอกสารสำเร็จ'
            };
        } catch (error) {
            await transaction.rollback();
            logger.error('Error updating document status:', error);
            throw error;
        }
    }

    /**
     * อัพเดทสถานะเอกสาร (legacy method - ใช้สำหรับ backward compatibility)
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

            await this._syncProjectCompletionFromDocument(document);

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
    async getDocuments(filters = {}, pagination = {}, userId = null, userRole = null) {
        try {
            const { type, status, search, semester } = filters;
            let { academicYear } = filters;
            const { limit = 50, offset = 0 } = pagination;

            // สร้าง query condition พื้นฐาน
            let whereCondition = {};

            // Student เห็นเฉพาะเอกสารตัวเอง
            const staffRoles = ['admin', 'teacher', 'head', 'staff'];
            if (userId && !staffRoles.includes(userRole)) {
                whereCondition.userId = userId;
            }

            // Default to current academic year for admin/teacher/staff when not specified
            if (!academicYear && staffRoles.includes(userRole)) {
                academicYear = await getCurrentAcademicYear();
            }

            if (type && type !== 'all') {
                whereCondition.documentType = type.toUpperCase();
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

            // สร้าง include array
            const includeArray = [
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
            ];

            // ถ้ามีการกรองด้วย academicYear หรือ semester (และ type เป็น internship)
            // ต้อง join กับ InternshipDocument หรือ ProjectDocument
            if ((academicYear || semester) && type === 'internship') {
                const internshipDocWhere = {};
                if (academicYear) internshipDocWhere.academicYear = academicYear;
                if (semester) internshipDocWhere.semester = semester;

                includeArray.push({
                    model: InternshipDocument,
                    as: 'internshipDocument',
                    attributes: ['internshipId', 'companyName', 'academicYear', 'semester'],
                    where: internshipDocWhere,
                    required: true, // inner join เพื่อกรองเฉพาะที่ match
                });
            } else if ((academicYear || semester) && type === 'project') {
                const projectDocWhere = {};
                if (academicYear) projectDocWhere.academicYear = academicYear;
                if (semester) projectDocWhere.semester = semester;

                includeArray.push({
                    model: ProjectDocument,
                    as: 'projectDocument',
                    attributes: ['projectId', 'projectName', 'academicYear', 'semester'],
                    where: projectDocWhere,
                    required: true,
                });
            }

            // ดึงข้อมูลเอกสารพร้อมข้อมูลที่เกี่ยวข้อง (ใช้ findAndCountAll เพื่อได้ total count)
            const { rows: documents, count: total } = await Document.findAndCountAll({
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
                include: includeArray,
                order: [['created_at', 'DESC']],
                limit,
                offset,
                distinct: true // สำคัญ: ใช้ distinct เพื่อนับแถวที่ถูกต้องเมื่อมี join
            });

            // นับสถิติ — ใช้ filter เดียวกับ query หลัก (type, academicYear, semester)
            // แต่ไม่รวม status เพื่อให้เห็นภาพรวมทุกสถานะ
            const statsWhere = {};
            if (type && type !== 'all') {
                statsWhere.documentType = type.toUpperCase();
            }
            if (userId && !staffRoles.includes(userRole)) {
                statsWhere.userId = userId;
            }

            const statsInclude = [];
            if ((academicYear || semester) && type === 'internship') {
                const internshipDocWhere = {};
                if (academicYear) internshipDocWhere.academicYear = academicYear;
                if (semester) internshipDocWhere.semester = semester;
                statsInclude.push({
                    model: InternshipDocument,
                    as: 'internshipDocument',
                    attributes: [],
                    where: internshipDocWhere,
                    required: true,
                });
            } else if ((academicYear || semester) && type === 'project') {
                const projectDocWhere = {};
                if (academicYear) projectDocWhere.academicYear = academicYear;
                if (semester) projectDocWhere.semester = semester;
                statsInclude.push({
                    model: ProjectDocument,
                    as: 'projectDocument',
                    attributes: [],
                    where: projectDocWhere,
                    required: true,
                });
            }

            const [statsTotal, statsPending, statsApproved, statsRejected] = await Promise.all([
                Document.count({ where: statsWhere, include: statsInclude, distinct: true }),
                Document.count({ where: { ...statsWhere, status: 'pending' }, include: statsInclude, distinct: true }),
                Document.count({ where: { ...statsWhere, status: 'approved' }, include: statsInclude, distinct: true }),
                Document.count({ where: { ...statsWhere, status: 'rejected' }, include: statsInclude, distinct: true }),
            ]);
            const statistics = { total: statsTotal, pending: statsPending, approved: statsApproved, rejected: statsRejected };

            // จัดรูปแบบข้อมูลก่อนส่งกลับ
            const formattedDocuments = documents.map(doc => {
                const base = {
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
                };

                // เพิ่มข้อมูล academicYear และ semester ถ้ามี
                if (doc.internshipDocument) {
                    base.academicYear = doc.internshipDocument.academicYear;
                    base.semester = doc.internshipDocument.semester;
                    base.companyName = doc.internshipDocument.companyName;
                } else if (doc.projectDocument) {
                    base.academicYear = doc.projectDocument.academicYear;
                    base.semester = doc.projectDocument.semester;
                    base.projectName = doc.projectDocument.projectName;
                }

                return base;
            });

            logger.info(`Retrieved ${documents.length} documents (total: ${total}) with filters:`, filters);

            return {
                documents: formattedDocuments,
                total, // Total count สำหรับ pagination
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
                where.documentType = type.toUpperCase();
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
     * รวมเอกสารฝึกงานทั้งหมดของนักศึกษา (CS05, ตอบรับ, ส่งตัว, รับรอง)
     */
    async getStudentDocumentsOverview(userId) {
        const referralLetterService = require('./internship/referralLetter.service');
        const certificateService = require('./internship/certificate.service');

        const STATUS_LABELS = {
            draft: 'ร่าง',
            pending: 'รอดำเนินการ',
            approved: 'อนุมัติแล้ว',
            rejected: 'ไม่อนุมัติ',
            supervisor_evaluated: 'ประเมินผลแล้ว',
            acceptance_approved: 'สถานประกอบการตอบรับแล้ว',
            referral_ready: 'หนังสือส่งตัวพร้อม',
            referral_downloaded: 'ดาวน์โหลดหนังสือส่งตัวแล้ว',
            completed: 'เสร็จสิ้น',
            cancelled: 'ยกเลิก',
        };
        const labelOf = (s) => STATUS_LABELS[s] || s || 'ไม่ระบุ';

        const documents = [];

        // 1. CS05
        const cs05 = await Document.findOne({
            where: { userId, documentName: 'CS05' },
            order: [['created_at', 'DESC']],
        });
        if (cs05) {
            documents.push({
                type: 'CS05',
                name: 'คำร้องขอฝึกงาน (CS05)',
                status: cs05.status,
                statusLabel: labelOf(cs05.status),
                documentId: cs05.documentId,
                canView: !!cs05.filePath,
                canDownload: !!cs05.filePath,
                downloadType: 'document',
            });
        }

        // 2. ACCEPTANCE_LETTER
        const acceptance = await Document.findOne({
            where: { userId, documentName: 'ACCEPTANCE_LETTER' },
            order: [['created_at', 'DESC']],
        });
        if (acceptance) {
            documents.push({
                type: 'ACCEPTANCE_LETTER',
                name: 'แบบฟอร์มตอบรับจากสถานประกอบการ',
                status: acceptance.status,
                statusLabel: labelOf(acceptance.status),
                documentId: acceptance.documentId,
                canView: !!acceptance.filePath,
                canDownload: !!acceptance.filePath,
                downloadType: 'document',
            });
        }

        // 3. REFERRAL_LETTER (generate on-the-fly)
        if (cs05) {
            try {
                const ref = await referralLetterService.getReferralLetterStatus(userId, cs05.documentId);
                const refStatus = ref.isDownloaded ? 'downloaded' : ref.isReady ? 'ready' : 'not_ready';
                const refLabel = ref.isDownloaded ? 'ดาวน์โหลดแล้ว' : ref.isReady ? 'พร้อมดาวน์โหลด' : 'ยังไม่พร้อม (รอตอบรับอนุมัติ)';
                documents.push({
                    type: 'REFERRAL_LETTER',
                    name: 'หนังสือส่งตัวนักศึกษา',
                    status: refStatus,
                    statusLabel: refLabel,
                    documentId: cs05.documentId,
                    canView: false,
                    canDownload: ref.isReady || ref.isDownloaded,
                    downloadType: 'referral',
                });
            } catch {
                documents.push({
                    type: 'REFERRAL_LETTER',
                    name: 'หนังสือส่งตัวนักศึกษา',
                    status: 'not_ready',
                    statusLabel: 'ยังไม่พร้อม',
                    documentId: null,
                    canView: false,
                    canDownload: false,
                    downloadType: 'referral',
                });
            }
        }

        // 4. CERTIFICATE (generate on-the-fly)
        try {
            const cert = await certificateService.getCertificateStatus(userId);
            const certStatus = cert.status; // 'not_requested', 'pending', 'ready'
            const certLabels = { ready: 'พร้อมดาวน์โหลด', pending: 'รออนุมัติ', not_requested: 'ยังไม่ได้ขอ' };
            documents.push({
                type: 'CERTIFICATE',
                name: 'หนังสือรับรองการฝึกงาน',
                status: certStatus,
                statusLabel: certLabels[certStatus] || 'ยังไม่พร้อม',
                documentId: null,
                canView: certStatus === 'ready',
                canDownload: certStatus === 'ready',
                downloadType: 'certificate',
            });
        } catch {
            // ไม่มี CS05 ที่ approved หรือยังไม่มีข้อมูล — ไม่แสดง
        }

        return documents;
    }

            async ensureProjectFinalDocument(projectId) {
                const normalizedProjectId = Number(projectId);
                if (!Number.isInteger(normalizedProjectId) || normalizedProjectId <= 0) {
                    throw new Error('รหัสโครงงานไม่ถูกต้อง');
                }

                const project = await ProjectDocument.findByPk(normalizedProjectId, {
                    include: [{ model: Document, as: 'document' }]
                });

                if (!project) {
                    throw new Error('ไม่พบโครงงาน');
                }

                if (project.document) {
                    return project.document;
                }

                let ownerStudentId = project.createdByStudentId ?? project.created_by_student_id ?? null;

                if (!ownerStudentId) {
                    const leaderMember = await ProjectMember.findOne({
                        where: { projectId: normalizedProjectId, role: 'leader' }
                    });
                    ownerStudentId = leaderMember?.studentId ?? leaderMember?.student_id ?? null;
                }

                if (!ownerStudentId) {
                    const anyMember = await ProjectMember.findOne({
                        where: { projectId: normalizedProjectId }
                    });
                    ownerStudentId = anyMember?.studentId ?? anyMember?.student_id ?? null;
                }

                if (!ownerStudentId) {
                    throw new Error('ไม่พบสมาชิกโครงงานสำหรับสร้างเล่มออฟไลน์');
                }

                const student = await Student.findByPk(ownerStudentId);
                if (!student || !student.userId) {
                    throw new Error('ไม่พบข้อมูลนักศึกษาสำหรับสร้างเล่มออฟไลน์');
                }

                const baseName = project.projectNameTh || project.projectNameEn || `Project ${project.projectId}`;
                const documentName = `Final Thesis Offline - ${baseName}`.slice(0, 250);

                const document = await Document.create({
                    userId: student.userId,
                    documentType: 'PROJECT',
                    documentName,
                    category: 'final',
                    status: 'pending',
                    submittedAt: new Date(),
                    isLate: false,
                    lateMinutes: null,
                    downloadStatus: 'not_downloaded'
                });

                await project.update({ documentId: document.documentId });
                    project.document = document;

                logger.info('create offline final document success', {
                    projectId: normalizedProjectId,
                    documentId: document.documentId
                });

                return document;
            }

            async updateProjectFinalDocumentStatus(projectId, status, reviewerId, comment = null) {
                if (!status) {
                    throw new Error('กรุณาระบุสถานะเล่มที่ต้องการตั้ง');
                }

                const document = await this.ensureProjectFinalDocument(projectId);
                await this.updateDocumentStatus(document.documentId, status, reviewerId, comment);

                return {
                    message: 'อัพเดทสถานะเอกสารสำเร็จ',
                    documentId: document.documentId,
                    status
                };
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

            // Update workflow สำหรับ ACCEPTANCE_LETTER
            if (document.documentType === 'INTERNSHIP' && document.documentName === 'ACCEPTANCE_LETTER') {
                const studentId = document.owner?.student?.studentId;
                if (studentId) {
                    // 1. สร้างหนังสือส่งตัว (Referral Letter) พร้อม generate PDF
                    try {
                        // หา CS05 ที่อนุมัติแล้วของนักศึกษาคนนี้
                        const cs05Document = await Document.findOne({
                            where: {
                                userId: document.userId,
                                documentName: 'CS05',
                                status: 'approved'
                            },
                            order: [['updated_at', 'DESC']]
                        });

                        if (cs05Document) {
                            // เรียกใช้ service สำหรับ generate PDF หนังสือส่งตัว
                            const internshipManagementService = require('./internshipManagementService');
                            const referralLetterResult = await internshipManagementService.generateReferralLetterPDF(
                                document.userId,
                                cs05Document.documentId
                            );
                            
                            logger.info(`Generated referral letter PDF for student ${studentId}:`, {
                                documentId: referralLetterResult.documentId,
                                filePath: referralLetterResult.filePath
                            });
                        } else {
                            logger.warn(`No approved CS05 found for student ${studentId}, skipping referral letter generation`);
                        }
                    } catch (refError) {
                        logger.error('Error generating referral letter:', refError);
                        // ไม่ throw error เพื่อไม่ให้กระทบการอนุมัติหนังสือตอบรับ
                    }

                    // 2. Update workflow เป็น AWAITING_START
                    const workflowService = require('./workflowService');
                    await workflowService.updateStudentWorkflowActivity(
                        studentId,
                        'internship',
                        'INTERNSHIP_AWAITING_START',
                        'in_progress',
                        'in_progress',
                        { 
                            acceptanceLetterApprovedAt: new Date().toISOString(), 
                            approvedBy: reviewerId,
                            referralLetterGenerated: true
                        }
                    );
                    logger.info(`Updated workflow to AWAITING_START for student ${studentId}`);
                }
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
        const { sequelize } = require('../config/database');
        const transaction = await sequelize.transaction();
        try {
            const document = await Document.findByPk(documentId, { lock: true, transaction });

            if (!document) {
                const notFoundErr = new Error('ไม่พบเอกสาร');
                notFoundErr.statusCode = 404;
                throw notFoundErr;
            }

            if (document.status === 'rejected') {
                const alreadyRejectedErr = new Error('เอกสารนี้ถูกปฏิเสธแล้ว');
                alreadyRejectedErr.statusCode = 400;
                throw alreadyRejectedErr;
            }

            const previousStatus = document.status;

            // บันทึกเหตุผลลง reviewComment (คอลัมน์จริงในตาราง documents)
            await document.update({
                status: 'rejected',
                reviewComment: reason || 'ไม่ได้ระบุเหตุผล',
                reviewerId: reviewerId,
                reviewDate: new Date()
            }, { transaction });

            // บันทึก DocumentLog เพื่อเก็บ audit trail ของการ reject
            try {
                await DocumentLog.create({
                    documentId: documentId,
                    userId: reviewerId,
                    actionType: 'reject',
                    previousStatus: previousStatus,
                    newStatus: 'rejected',
                    comment: reason || 'ไม่ได้ระบุเหตุผล'
                }, { transaction });
            } catch (logErr) {
                logger.warn('Unable to create DocumentLog for rejection:', logErr.message);
            }

            await transaction.commit();
            logger.info(`Document rejected: ${documentId} by ${reviewerId}`);

            // ส่ง notification แจ้งนักศึกษา (นอก transaction — ไม่ควร rollback ถ้า notification fail)
            let notificationSent = false;
            if (document.userId) {
                try {
                    await notificationService.createAndNotify(document.userId, {
                        type: 'DOCUMENT',
                        title: `เอกสาร${document.fileName || ''} ถูกปฏิเสธ`,
                        message: reason || 'กรุณาตรวจสอบและแก้ไข',
                        metadata: {
                            documentId: document.documentId,
                            documentType: document.documentType || null,
                            action: 'rejected',
                            targetUrl: document.documentType === 'INTERNSHIP'
                                ? (['ACCEPTANCE_LETTER', 'REFERRAL_LETTER'].includes(document.documentName)
                                    ? '/internship-registration/flow'
                                    : '/internship-registration')
                                : '/project/documents'
                        }
                    });
                    notificationSent = true;
                } catch (notifErr) {
                    logger.warn('Notification failed (document reject):', notifErr.message);
                }
            }

            return {
                message: 'ปฏิเสธเอกสารเรียบร้อยแล้ว',
                reviewComment: document.reviewComment,
                notificationSent
            };
        } catch (error) {
            if (!transaction.finished) {
                await transaction.rollback();
            }
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
                order: [['created_at', 'DESC']]
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
                order: [['created_at', 'DESC']]
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
    async validateDocumentFile(documentId, userId = null, userRole = null) {
        try {
            const document = await Document.findByPk(documentId);

            if (!document) {
                throw new Error('ไม่พบเอกสาร');
            }

            // Ownership check — staff/admin/teacher ดูได้ทั้งหมด, student ดูได้เฉพาะของตัวเอง
            if (userId) {
                const staffRoles = ['admin', 'teacher', 'head', 'staff'];
                if (!staffRoles.includes(userRole) && document.userId !== userId) {
                    throw new Error('ไม่มีสิทธิ์เข้าถึงเอกสารนี้');
                }
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
                // ✅ เมื่ออนุมัติ CS05 → ตั้งสถานะเป็น 'pending_approval' (รอหนังสือตอบรับ)
                await student.update({
                    internshipStatus: 'pending_approval',
                    isEnrolledInternship: 1
                });
                logger.info(`Updated student ${student.studentId} internship status to pending_approval (CS05 approved, waiting for acceptance letter)`);
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
            const { status, studentId, academicYear, semester, search } = filters;
            const { page = 1, limit = 10 } = pagination;

            const whereClause = {};
            if (status) whereClause.status = status;
            if (studentId) whereClause.studentId = { [Op.like]: `%${studentId}%` };
            // search: ค้นหาจาก studentCode หรือชื่อ (ผ่าน include where ด้านล่าง)
            const searchCondition = search ? { [Op.or]: [
                { '$student.studentCode$': { [Op.like]: `%${search}%` } },
                { '$student.user.firstName$': { [Op.like]: `%${search}%` } },
                { '$student.user.lastName$': { [Op.like]: `%${search}%` } },
            ] } : null;

            const { InternshipCertificateRequest, InternshipLogbook } = require('../models');

            // สร้าง include สำหรับ internship -> internshipDocument
            const includeArray = [
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
            ];

            // ถ้ามีการกรองด้วย academicYear หรือ semester ต้อง join กับ InternshipDocument
            if (academicYear || semester) {
                const internshipDocWhere = {};
                if (academicYear) internshipDocWhere.academicYear = academicYear;
                if (semester) internshipDocWhere.semester = semester;

                includeArray.push({
                    model: InternshipDocument,
                    as: 'internship',
                    attributes: ['internshipId', 'companyName', 'academicYear', 'semester'],
                    where: internshipDocWhere,
                    required: true, // inner join เพื่อกรองเฉพาะที่ match
                });
            }

            const requests = await InternshipCertificateRequest.findAndCountAll({
                where: searchCondition ? { ...whereClause, ...searchCondition } : whereClause,
                include: includeArray,
                order: [['requestDate', 'DESC']],
                limit: parseInt(limit),
                offset: (parseInt(page) - 1) * parseInt(limit),
            });

            // ✅ คำนวณ approvedHours จริงๆ จาก logbooks แทนที่จะใช้ค่าจาก database
            const formattedData = await Promise.all(requests.rows.map(async (request) => {
                const requestJSON = request.toJSON();
                
                // คำนวณ approvedHours จริงๆ
                const logbooks = await InternshipLogbook.findAll({
                    where: {
                        studentId: request.studentId,
                        internshipId: request.internshipId,
                    },
                });
                
                const approvedHours = logbooks
                    .filter((log) => log.supervisorApproved === 1 || log.supervisorApproved === true)
                    .reduce((sum, log) => sum + parseFloat(log.workHours || 0), 0);
                
                // ถ้ายังไม่มี internship ใน include (กรณีไม่มีการกรองปีการศึกษา) ให้ดึงเพิ่ม
                let internshipData = requestJSON.internship || null;
                if (!internshipData && request.internshipId) {
                    const internshipDoc = await InternshipDocument.findByPk(request.internshipId, {
                        attributes: ['internshipId', 'companyName', 'academicYear', 'semester'],
                    });
                    if (internshipDoc) {
                        internshipData = internshipDoc.toJSON();
                    }
                }
                
                return {
                    ...requestJSON,
                    totalHours: approvedHours, // ✅ ใช้ approved hours แทน
                    _originalTotalHours: requestJSON.totalHours, // เก็บค่าเดิมไว้ (ถ้าต้องการ debug)
                    internship: internshipData, // ✅ ส่ง academicYear & semester กลับไป
                    student: request.student ? {
                        ...request.student.toJSON(),
                        fullName: `${request.student.user.firstName} ${request.student.user.lastName}`,
                    } : null,
                };
            }));

            logger.info(`Retrieved ${requests.count} certificate requests with calculated approved hours`);

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
            const { PASS_SCORE: passScore, FULL_SCORE: defaultFullScore } = require('../config/scoring');
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

            // ✅ คำนวณ approvedHours จริงๆ จาก logbooks
            const { InternshipLogbook } = require('../models');
            const logbooks = await InternshipLogbook.findAll({
                where: {
                    studentId: request.studentId,
                    internshipId: request.internshipId,
                },
            });
            
            const approvedHours = logbooks
                .filter((log) => log.supervisorApproved === 1 || log.supervisorApproved === true)
                .reduce((sum, log) => sum + parseFloat(log.workHours || 0), 0);

            // คำนวณคะแนนเต็มจาก breakdown items — fallback เป็น FULL_SCORE (100) เมื่อ breakdown ไม่มี max
            const breakdownMax = breakdown.length > 0
                ? breakdown.reduce((sum, item) => sum + (typeof item.max === 'number' ? item.max : 0), 0)
                : 0;
            const fullScore = breakdownMax > 0 ? breakdownMax : defaultFullScore;

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
                    totalHours: approvedHours, // ✅ ใช้ approved hours แทน
                    _originalTotalHours: request.totalHours, // เก็บค่าเดิม (ถ้าต้องการ debug)
                    internshipId: request.internshipId || internshipDoc?.internshipId || null,
                },
                eligibility: {
                    hours: { current: Number(approvedHours), required: 240, passed: Number(approvedHours) >= 240 },
                    evaluation: {
                        status: request.evaluationStatus,
                        overallScore,
                        passScore,
                        fullScore,
                        passed: evaluationPassed
                    },
                    // summary เดิม (JSON) เปลี่ยนใช้สำหรับตรวจว่าพร้อมสร้าง PDF หรือไม่
                    summary: { available: request.summaryStatus === 'submitted' }
                },
                evaluationDetail: {
                    overallScore,
                    passScore,
                    fullScore,
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

            // ✅ Update workflow และ Student.internshipStatus - การฝึกงานเสร็จสมบูรณ์
            try {
                const { Internship, Student } = require('../models');
                const internship = await Internship.findByPk(request.internshipId, {
                    include: [{ model: Student, as: 'student' }]
                });
                
                if (internship?.student) {
                    const workflowService = require('./workflowService');
                    
                    // 1. อัพเดท workflow
                    await workflowService.updateStudentWorkflowActivity(
                        internship.student.studentId,
                        'internship',
                        'INTERNSHIP_COMPLETED',
                        'completed',
                        'completed',
                        { 
                            certificateApprovedAt: new Date().toISOString(),
                            certificateNumber: request.certificateNumber,
                            processedBy: processorId 
                        }
                    );
                    
                    // 2. ✅ อัพเดท Student.internshipStatus เป็น 'completed'
                    await Student.update(
                        { internshipStatus: 'completed' },
                        { where: { studentId: internship.student.studentId } }
                    );
                    
                    logger.info(`Updated workflow and student status to COMPLETED for student ${internship.student.studentId} (certificate approved)`);
                }
            } catch (workflowError) {
                logger.error('Error updating workflow and student status after certificate approval:', workflowError);
                // ไม่ throw error เพราะ certificate ได้รับการอนุมัติแล้ว
            }

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

            if (request.status === 'rejected') {
                const err = new Error('คำขอนี้ถูกปฏิเสธแล้ว');
                err.statusCode = 400;
                throw err;
            }
            if (request.status !== 'pending') {
                const err = new Error('คำขอนี้ได้รับการดำเนินการแล้ว');
                err.statusCode = 400;
                throw err;
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
            const internshipCertificateService = require('./internship/certificate.service');

            // Query request เพื่อหา userId ของนักศึกษา
            const request = await InternshipCertificateRequest.findByPk(requestId, {
                include: [
                    {
                        model: Student,
                        as: 'student',
                        attributes: ['userId'],
                    },
                ],
            });

            if (!request) {
                throw new Error('ไม่พบคำขอหนังสือรับรอง');
            }

            if (request.status !== 'approved') {
                throw new Error('คำขอยังไม่ได้รับการอนุมัติ');
            }

            // ใช้ certificate.service.js ที่มี pdfkit + Thai font จริง
            const userId = request.student.userId;
            const certificateData = await internshipCertificateService.getCertificateData(userId);
            const pdfBuffer = await internshipCertificateService.createCertificatePDF(certificateData);

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


    _isProjectFinalDocument(document) {
        if (!document) {
            return false;
        }

        const doc = document.toJSON ? document.toJSON() : document;
        const type = String(doc.documentType || doc.document_type || '').toUpperCase();
        const category = String(doc.category || '').toLowerCase();
        return type === 'PROJECT' && category === 'final';
    }

    _isFinalDocumentApproved(document) {
        if (!document) {
            return false;
        }

        const doc = document.toJSON ? document.toJSON() : document;
        const status = String(doc.status || '').toLowerCase();
        return FINAL_DOCUMENT_ACCEPTED_STATUSES.has(status);
    }

    async _syncProjectCompletionFromDocument(document) {
        try {
            if (!this._isProjectFinalDocument(document)) {
                return;
            }

            const documentId = document.documentId ?? document.id ?? document.document_id;
            if (!documentId) {
                return;
            }

            const project = await ProjectDocument.findOne({
                where: { documentId },
                include: [
                    {
                        model: ProjectExamResult,
                        as: 'examResults',
                        required: false
                    }
                ]
            });

            if (!project) {
                return;
            }

            if (project.status === 'archived' || project.status === 'failed') {
                return;
            }

            const thesisResult = (project.examResults || []).find((exam) => {
                const examType = (exam.examType || exam.exam_type || '').toUpperCase();
                return examType === 'THESIS';
            });

            const thesisPassed = thesisResult && String(thesisResult.result || '').toUpperCase() === 'PASS';

            if (!thesisPassed) {
                if (project.status === 'completed') {
                    await project.update({ status: 'in_progress' });
                    await projectDocumentService.syncProjectWorkflowState(project.projectId);
                    logger.info('Project reverted to in-progress because thesis exam result is not PASS', { projectId: project.projectId });
                }
                return;
            }

            const documentReady = this._isFinalDocumentApproved(document);

            if (documentReady && project.status !== 'completed') {
                await project.update({ status: 'completed' });
                await projectDocumentService.syncProjectWorkflowState(project.projectId);
                logger.info('Project marked as completed after final document approval', { projectId: project.projectId });
            } else if (!documentReady && project.status === 'completed') {
                await project.update({ status: 'in_progress' });
                await projectDocumentService.syncProjectWorkflowState(project.projectId);
                logger.info('Project reverted to in-progress due to final document status change', { projectId: project.projectId });
            }
        } catch (error) {
            logger.warn('syncProjectCompletionFromDocument failed', {
                documentId: document?.documentId ?? document?.id,
                error: error.message
            });
        }
    }
}

module.exports = new DocumentService();
