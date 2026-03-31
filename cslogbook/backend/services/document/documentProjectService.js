const {
    Student,
    Document,
    ProjectDocument,
    ProjectMember,
} = require('../../models');
const logger = require('../../utils/logger');

/**
 * สร้าง/ดึง offline final document สำหรับโครงงาน
 */
async function ensureProjectFinalDocument(projectId) {
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

/**
 * อัปเดตสถานะเล่มโครงงาน
 */
async function updateProjectFinalDocumentStatus(projectId, status, reviewerId, comment = null) {
    if (!status) {
        throw new Error('กรุณาระบุสถานะเล่มที่ต้องการตั้ง');
    }

    const document = await ensureProjectFinalDocument(projectId);
    // Lazy require to avoid circular dependency with core
    const { updateDocumentStatus } = require('./documentCoreService');
    await updateDocumentStatus(document.documentId, status, reviewerId, comment);

    return {
        message: 'อัพเดทสถานะเอกสารสำเร็จ',
        documentId: document.documentId,
        status
    };
}

module.exports = {
    ensureProjectFinalDocument,
    updateProjectFinalDocumentStatus,
};
