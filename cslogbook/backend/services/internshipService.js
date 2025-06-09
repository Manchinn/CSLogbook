const { Document, Student, User, WorkflowActivity, Notification } = require('../models');
const notificationService = require('./notificationService');

class InternshipService {
    /**
     * อนุมัติเอกสาร คพ.05
     */
    async approveCS05(documentId, adminId) {
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
            const result = await this.handleCS05Approval(document, adminId);
            if (!result) {
                throw new Error('Failed to handle CS05 approval workflow');
            }
            
            return { 
                success: true, 
                message: 'อนุมัติ คพ.05 เรียบร้อยแล้ว นักศึกษาจะได้รับการแจ้งเตือนให้ดำเนินการต่อไป' 
            };
        } catch (error) {
            console.error('Error approving CS05:', error);
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
            reviewedBy: adminId,
            reviewedAt: new Date()
        });
        
        return document;
    }

    /**
     * จัดการขั้นตอน workflow เมื่ออนุมัติเอกสาร CS05
     */
    async handleCS05Approval(document, adminId) {
        try {
            console.log(`Starting handleCS05Approval for document ID: ${document.documentId}, by admin: ${adminId}`);
            
            const studentId = document.owner?.student?.studentId;
            if (!studentId) {
                console.error(`Cannot find studentId for document ${document.documentId}`);
                return false;
            }
            
            console.log(`Processing workflow for student: ${studentId}`);
            
            // 1. อัปเดตขั้นตอน "รออนุมัติ" เป็นเสร็จสิ้น
            await this.updateWorkflowActivity(
                studentId,
                'internship',
                'INTERNSHIP_CS05_APPROVAL_PENDING',
                'completed',
                'in_progress',
                { 
                    approvedBy: adminId,
                    approvedAt: new Date().toISOString()
                }
            );
            
            // 2. เพิ่มขั้นตอน "ได้รับอนุมัติ" และทำเครื่องหมายว่าเสร็จสิ้น
            await this.updateWorkflowActivity(
                studentId,
                'internship',
                'INTERNSHIP_CS05_APPROVED',
                'completed',
                'in_progress',
                { 
                    approvedBy: adminId,
                    approvedAt: new Date().toISOString()
                }
            );
            
            // 3. สร้างขั้นตอนถัดไป "รอหนังสือตอบรับ"
            await this.updateWorkflowActivity(
                studentId,
                'internship',
                'INTERNSHIP_COMPANY_RESPONSE_PENDING',
                'awaiting_student_action',
                'in_progress',
                {}
            );
            
            console.log(`Workflow updated successfully for student: ${studentId}`);
            
            // 4. สร้างการแจ้งเตือน (ถ้ามีโมเดล Notification)
            try {
                if (Notification) {
                    await Notification.create({
                        userId: document.userId,
                        title: 'เอกสาร คพ.05 ได้รับการอนุมัติแล้ว',
                        message: 'คำร้องขอฝึกงานของคุณได้รับการอนุมัติแล้ว โปรดดำเนินการขั้นตอนถัดไป',
                        type: 'document_approved',
                        referenceId: document.documentId,
                        isRead: false
                    });
                }
            } catch (notifyError) {
                console.error('Error creating notification:', notifyError);
                // ไม่ทำให้กระบวนการล้มเหลวหากแจ้งเตือนไม่สำเร็จ
            }
            
            return true;
        } catch (error) {
            console.error('Error handling CS05 approval workflow:', error);
            throw error;
        }
    }
    
    /**
     * อัปเดตหรือสร้าง workflow activity สำหรับนักศึกษา
     */
    async updateWorkflowActivity(studentId, workflowType, stepKey, status, workflowStatus, metadata) {
        console.log(`Updating workflow: ${workflowType}.${stepKey} for student ${studentId} to ${status}`);
        
        try {
            // ค้นหา activity ที่มีอยู่แล้ว
            let activity = await WorkflowActivity.findOne({
                where: {
                    studentId,
                    workflowType,
                    stepKey
                }
            });
            
            // ถ้าไม่มี ให้สร้างใหม่
            if (!activity) {
                console.log(`Creating new workflow activity: ${stepKey}`);
                activity = await WorkflowActivity.create({
                    studentId,
                    workflowType,
                    stepKey,
                    status,
                    workflowStatus,
                    metadata: JSON.stringify(metadata || {})
                });
            } else {
                // ถ้ามีอยู่แล้ว ให้อัปเดต
                console.log(`Updating existing workflow activity: ${stepKey}`);
                await activity.update({
                    status,
                    workflowStatus,
                    metadata: JSON.stringify({
                        ...JSON.parse(activity.metadata || '{}'),
                        ...(metadata || {})
                    })
                });
            }
            
            console.log(`Successfully updated workflow activity: ${stepKey}`);
            return activity;
        } catch (error) {
            console.error(`Error updating workflow activity ${stepKey}:`, error);
            throw error;
        }
    }
}

module.exports = new InternshipService();