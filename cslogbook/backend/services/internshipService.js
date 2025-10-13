const { Document, Student, User } = require('../models');
const workflowService = require('./workflowService');
const logger = require('../utils/logger');

class InternshipService {
    /**
     * อนุมัติเอกสาร คพ.05
     */
    async approveCS05(documentId, adminId, options = {}) {
        try {
            // 1. เรียกใช้ฟังก์ชันพื้นฐานเพื่ออัปเดตสถานะเอกสาร
            await this._approveDocumentBase(documentId, adminId);
            
            // 2. ดึงข้อมูลเอกสารและข้อมูลนักศึกษา
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
                throw new Error('Document not found after approval');
            }
            
            // 3. จัดการขั้นตอน workflow เมื่ออนุมัติเอกสาร CS05
            const result = await this.handleCS05Approval(document, adminId, options);
            if (!result) {
                throw new Error('Failed to handle CS05 approval workflow');
            }
            
            return { 
                success: true, 
                message: 'อนุมัติ คพ.05 เรียบร้อยแล้ว นักศึกษาจะได้รับการแจ้งเตือนให้ดำเนินการต่อไป' 
            };
        } catch (error) {
            logger.error('Error approving CS05:', error);
            throw error;
        }
    }

    /**
     * ฟังก์ชันพื้นฐานสำหรับอัปเดตสถานะเอกสารเป็น approved
     * (เรียกใช้ approveDocument ภายใน)
     */
    async _approveDocumentBase(documentId, adminId) {
        const document = await Document.findByPk(documentId);
        if (!document) {
            throw new Error('Document not found');
        }
        
        await document.update({
            status: 'approved',
            reviewerId: adminId,
            reviewDate: new Date()
        });
        
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
                                    await workflowService.updateStudentWorkflowActivity(
                            studentId,
                            'internship',
                            'INTERNSHIP_CS05_APPROVAL_PENDING',
                            'completed',
                            'in_progress',
                                        { approvedBy: adminId, approvedAt: new Date().toISOString(), letterType: options.letterType || null }
                        );

                        // เพิ่มขั้นตอน "ได้รับอนุมัติ" และทำเครื่องหมายว่าเสร็จสิ้น
                                    await workflowService.updateStudentWorkflowActivity(
                            studentId,
                            'internship',
                            'INTERNSHIP_CS05_APPROVED',
                            'completed',
                            'in_progress',
                                        { approvedBy: adminId, approvedAt: new Date().toISOString(), letterType: options.letterType || null }
                        );

                        // สร้างขั้นตอนถัดไป "รอหนังสือตอบรับ"
                                    await workflowService.updateStudentWorkflowActivity(
                            studentId,
                            'internship',
                            'INTERNSHIP_COMPANY_RESPONSE_PENDING',
                            'awaiting_student_action',
                            'in_progress',
                                        { nextAction: 'upload_acceptance_letter' }
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