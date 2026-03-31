const { Op } = require('sequelize');
const fs = require('fs');
const {
    User,
    Student,
    Document,
    InternshipDocument,
    ProjectDocument,
    DocumentLog
} = require('../../models');
const { UPLOAD_CONFIG } = require('../../config/uploadConfig');
const logger = require('../../utils/logger');
const { getCurrentAcademicYear } = require('../../utils/studentUtils');
const deadlineAutoAssignService = require('../deadlineAutoAssignService');

/**
 * อัพโหลดเอกสารและบันทึกข้อมูลลงฐานข้อมูล
 */
async function uploadDocument(userId, fileData, documentData) {
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
            const { ImportantDeadline } = require('../../models');
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
async function getDocumentById(documentId, includeRelations = true) {
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
async function updateStatus(documentId, status, comment, userId) {
    const { sequelize } = require('../../config/database');
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
        // Lazy require to avoid circular dependency
        const { _syncProjectCompletionFromDocument } = require('./documentApprovalService');
        await _syncProjectCompletionFromDocument(document);

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
async function updateDocumentStatus(documentId, status, reviewerId, comment = null) {
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

        // Lazy require to avoid circular dependency
        const { _syncProjectCompletionFromDocument } = require('./documentApprovalService');
        await _syncProjectCompletionFromDocument(document);

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
async function getDocuments(filters = {}, pagination = {}, userId = null, userRole = null) {
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
async function getDocumentsByUser(userId, options = {}) {
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
 * ค้นหาเอกสาร
 */
async function searchDocuments(query, filters = {}) {
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
async function getRecentDocuments(limit = 10) {
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
async function validateDocumentFile(documentId, userId = null, userRole = null) {
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
async function getDocumentStatistics() {
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

module.exports = {
    uploadDocument,
    getDocumentById,
    updateStatus,
    updateDocumentStatus,
    getDocuments,
    getDocumentsByUser,
    searchDocuments,
    getRecentDocuments,
    validateDocumentFile,
    getDocumentStatistics,
};
