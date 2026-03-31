const {
    User,
    Student,
    Document,
    StudentWorkflowActivity,
    Notification,
} = require('../../models');
const logger = require('../../utils/logger');

/**
 * จัดการ workflow สำหรับ CS05 ที่ได้รับการอนุมัติ
 */
async function processCS05Approval(document, adminId) {
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
        await updateInternshipWorkflow(document, adminId);

        // สร้างการแจ้งเตือน
        const { createApprovalNotification } = require('./documentApprovalService');
        await createApprovalNotification(document);

    } catch (error) {
        logger.error('Error processing CS05 approval:', error);
        throw error;
    }
}

/**
 * อัปเดต workflow activity สำหรับ CS05
 */
async function updateInternshipWorkflow(document, adminId) {
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
 * รวมเอกสารฝึกงานทั้งหมดของนักศึกษา (CS05, ตอบรับ, ส่งตัว, รับรอง)
 */
async function getStudentDocumentsOverview(userId) {
    const referralLetterService = require('../internship/referralLetter.service');
    const certificateService = require('../internship/certificate.service');

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

module.exports = {
    processCS05Approval,
    updateInternshipWorkflow,
    getStudentDocumentsOverview,
};
