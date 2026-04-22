const { Document, Student, User, sequelize } = require('../models');
const workflowService = require('./workflowService');
const logger = require('../utils/logger');

class InternshipService {
    /**
     * อนุมัติเอกสาร คพ.05
     */
    async approveCS05(documentId, adminId, options = {}) {
        const transaction = await sequelize.transaction();
        try {
            // 1. เรียกใช้ฟังก์ชันพื้นฐานเพื่ออัปเดตสถานะเอกสาร
            await this._approveDocumentBase(documentId, adminId, { transaction });

            // 2. ดึงข้อมูลเอกสารและข้อมูลนักศึกษา
            const document = await Document.findByPk(documentId, {
                include: [{
                    model: User,
                    as: 'owner',
                    include: [{
                        model: Student,
                        as: 'student'
                    }]
                }],
                transaction
            });

            if (!document) {
                throw new Error('Document not found after approval');
            }

            // 3. จัดการขั้นตอน workflow เมื่ออนุมัติเอกสาร CS05
            const result = await this.handleCS05Approval(document, adminId, { ...options, transaction });
            if (!result) {
                throw new Error('Failed to handle CS05 approval workflow');
            }

            await transaction.commit();

            return {
                success: true,
                message: 'อนุมัติ คพ.05 เรียบร้อยแล้ว นักศึกษาจะได้รับการแจ้งเตือนให้ดำเนินการต่อไป'
            };
        } catch (error) {
            await transaction.rollback();
            logger.error('Error approving CS05:', error);
            throw error;
        }
    }

    /**
     * ฟังก์ชันพื้นฐานสำหรับอัปเดตสถานะเอกสารเป็น approved
     * (เรียกใช้ approveDocument ภายใน)
     */
    async _approveDocumentBase(documentId, adminId, options = {}) {
        const document = await Document.findByPk(documentId, options.transaction ? { transaction: options.transaction } : undefined);
        if (!document) {
            throw new Error('Document not found');
        }

        // เตรียมข้อมูล Signatory Snapshot
        let snapshotData = {};
        const signatoryId = document.signatoryId;
        
        if (signatoryId) {
            const { Signatory } = require('../models');
            try {
                const signatory = await Signatory.findByPk(signatoryId);
                if (signatory) {
                    snapshotData = {
                        signatoryId: signatory.id,
                        signatoryNameSnapshot: signatory.name,
                        signatoryTitleSnapshot: signatory.title,
                        signatorySignatureSnapshot: signatory.signatureUrl
                    };
                }
            } catch (err) {
                logger.warn('Failed to Create Signatory Snapshot for CS05 approval:', err.message);
            }
        }

        await document.update({
            status: 'approved',
            reviewerId: adminId,
            reviewDate: new Date(),
            ...snapshotData
        }, options.transaction ? { transaction: options.transaction } : undefined);

        return document;
    }

    /**
     * จัดการขั้นตอน workflow เมื่ออนุมัติเอกสาร CS05
     */
    async handleCS05Approval(document, adminId, options = {}) {
        try {
            logger.info(`Starting handleCS05Approval for document ID: ${document.documentId}, by admin: ${adminId}`);
            
            const studentId = document.owner?.student?.studentId;
            if (!studentId) {
                logger.error(`Cannot find studentId for document ${document.documentId}`);
                return false;
            }
            
            logger.info(`Processing workflow for student: ${studentId}`);
            
                        // 1) ปรับสถานะ workflow ผ่าน workflowService ให้สอดคล้องกับตาราง StudentWorkflowActivity
                        // อัปเดตขั้นตอน "รออนุมัติ" เป็นเสร็จสิ้น
            const txOpts = options.transaction ? { transaction: options.transaction } : {};

            await workflowService.updateStudentWorkflowActivity(
                studentId,
                'internship',
                'INTERNSHIP_CS05_APPROVAL_PENDING',
                'completed',
                'in_progress',
                { approvedBy: adminId, approvedAt: new Date().toISOString(), letterType: options.letterType || null },
                txOpts
            );

            await workflowService.updateStudentWorkflowActivity(
                studentId,
                'internship',
                'INTERNSHIP_CS05_APPROVED',
                'completed',
                'in_progress',
                { approvedBy: adminId, approvedAt: new Date().toISOString(), letterType: options.letterType || null },
                txOpts
            );

            await workflowService.updateStudentWorkflowActivity(
                studentId,
                'internship',
                'INTERNSHIP_COMPANY_RESPONSE_PENDING',
                'awaiting_student_action',
                'in_progress',
                { nextAction: 'upload_acceptance_letter' },
                txOpts
            );
            
            logger.info(`Workflow updated successfully for student: ${studentId}`);
            
            // 4. สร้างการแจ้งเตือน (ถ้ามีโมเดล Notification)
            // หมายเหตุ: โมเดล Notification ยังไม่มีในระบบปัจจุบัน จึงข้ามการสร้าง notification ตรงนี้

            // TODO: สร้างไฟล์หนังสือทางการหลังอนุมัติ
            // - options.letterType อาจเป็น 'request_letter' หรือ 'referral_letter'
            // - ณ ตอนนี้ยังไม่ได้ generate PDF ที่นี่ เพื่อให้สอดคล้องกับโฟลว์ react-pdf ฝั่ง frontend
            //   สามารถเพิ่ม service การสร้างไฟล์และบันทึก filePath ที่ Document หรือ InternshipDocument ได้ในงานถัดไป
            
            return true;
        } catch (error) {
            logger.error('Error handling CS05 approval workflow:', error);
            throw error;
        }
    }
    
    /**
     * อัปเดตหรือสร้าง workflow activity สำหรับนักศึกษา
     */
        // เดิมมีเมธอด updateWorkflowActivity ที่อ้างอิงโมเดล WorkflowActivity (ไม่มีอยู่จริง)
        // หากโค้ดภายนอกเรียกใช้ จะกระจายไปใช้ workflowService เพื่อความเข้ากันได้ย้อนหลัง
        async updateWorkflowActivity(studentId, workflowType, stepKey, status, workflowStatus, metadata) {
            return workflowService.updateStudentWorkflowActivity(
                studentId,
                workflowType,
                stepKey,
                status,
                workflowStatus,
                metadata
            );
        }
}

module.exports = new InternshipService();