const {
    User,
    Student,
    Document,
    DocumentLog,
    Notification,
    ProjectDocument,
    ProjectExamResult,
} = require('../../models');
const logger = require('../../utils/logger');
const { logAction } = require('../../utils/auditLog');
const notificationService = require('../notificationService');
const projectDocumentService = require('../projectDocumentService');

const FINAL_DOCUMENT_ACCEPTED_STATUSES = new Set([
    'approved',
    'completed',
    'supervisor_evaluated',
    'acceptance_approved',
    'referral_ready',
    'referral_downloaded'
]);

/**
 * อนุมัติเอกสาร
 */
async function approveDocument(documentId, reviewerId) {
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
                        const internshipManagementService = require('../internshipManagementService');
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
                const workflowService = require('../workflowService');
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
        logAction('APPROVE_DOCUMENT', `อนุมัติเอกสาร documentId=${documentId}`, { userId: reviewerId });
        return { message: 'อนุมัติเอกสารเรียบร้อยแล้ว' };
    } catch (error) {
        logger.error('Error approving document:', error);
        throw error;
    }
}

/**
 * ปฏิเสธเอกสาร
 */
async function rejectDocument(documentId, reviewerId, reason = null) {
    const { sequelize } = require('../../config/database');
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

        logAction('REJECT_DOCUMENT', `ส่งกลับเอกสาร documentId=${documentId}`, { userId: reviewerId });
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
 * สร้างการแจ้งเตือนสำหรับการอนุมัติเอกสาร
 */
async function createApprovalNotification(document) {
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

// --- Private helpers ---

function _isProjectFinalDocument(document) {
    if (!document) {
        return false;
    }

    const doc = document.toJSON ? document.toJSON() : document;
    const type = String(doc.documentType || doc.document_type || '').toUpperCase();
    const category = String(doc.category || '').toLowerCase();
    return type === 'PROJECT' && category === 'final';
}

function _isFinalDocumentApproved(document) {
    if (!document) {
        return false;
    }

    const doc = document.toJSON ? document.toJSON() : document;
    const status = String(doc.status || '').toLowerCase();
    return FINAL_DOCUMENT_ACCEPTED_STATUSES.has(status);
}

async function _syncProjectCompletionFromDocument(document) {
    try {
        if (!_isProjectFinalDocument(document)) {
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

        const documentReady = _isFinalDocumentApproved(document);

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

module.exports = {
    approveDocument,
    rejectDocument,
    createApprovalNotification,
    _isProjectFinalDocument,
    _isFinalDocumentApproved,
    _syncProjectCompletionFromDocument,
    FINAL_DOCUMENT_ACCEPTED_STATUSES,
};
