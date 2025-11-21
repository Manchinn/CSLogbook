const { DeadlineWorkflowMapping, ImportantDeadline } = require('../models');
const logger = require('../utils/logger');

/**
 * Service สำหรับการจับคู่ deadline กับเอกสารอัตโนมัติ
 * ตาม configuration ใน deadline_workflow_mappings
 */
class DeadlineAutoAssignService {
    /**
     * ค้นหา deadline ที่เหมาะสมสำหรับเอกสาร
     * @param {Object} documentData - { documentType, category, workflowType, studentId, academicYear, semester }
     * @returns {Promise<number|null>} - important_deadline_id หรือ null
     */
    async findMatchingDeadline(documentData) {
        try {
            const { documentType, category, workflowType, academicYear, semester } = documentData;
            
            // สร้าง document_subtype จาก documentType + category
            // เช่น INTERNSHIP + proposal = 'KP01', 'KP02' ฯลฯ
            const documentSubtype = this._mapToDocumentSubtype(documentType, category);
            
            if (!documentSubtype) {
                logger.debug('[DeadlineAutoAssign] ไม่สามารถ map document subtype:', { documentType, category });
                return null;
            }

            // ค้นหา mapping ที่ active
            const mapping = await DeadlineWorkflowMapping.findOne({
                where: {
                    workflowType: workflowType || this._inferWorkflowType(documentType),
                    documentSubtype,
                    active: true
                },
                include: [{
                    model: ImportantDeadline,
                    as: 'deadline',
                    where: {
                        academicYear: academicYear || new Date().getFullYear() + 543, // พ.ศ.
                        semester: semester || 1,
                        acceptingSubmissions: true
                    }
                }]
            });

            if (mapping && mapping.deadline) {
                logger.info('[DeadlineAutoAssign] พบ deadline:', {
                    deadlineId: mapping.deadline.id,
                    deadlineName: mapping.deadline.name,
                    documentSubtype
                });
                return mapping.deadline.id;
            }

            return null;
        } catch (error) {
            logger.error('[DeadlineAutoAssign] Error finding deadline:', error);
            return null;
        }
    }

    /**
     * แปลงจาก documentType + category เป็น document_subtype
     * ต้องตรงกับ documentSubtype ใน deadlineTemplates.js
     */
    _mapToDocumentSubtype(documentType, category) {
        const mapping = {
            // เอกสารฝึกงาน (ตาม deadlineTemplates.js)
            'INTERNSHIP:proposal': 'CS05',              // คพ.05 - คำร้องขอฝึกงาน
            'INTERNSHIP:acceptance': 'acceptance_letter', // หนังสือตอบรับ
            'INTERNSHIP:final': 'report',               // รายงานผลการฝึกงาน
            
            // เอกสารฝึกงานแบบเดิม (backward compatibility)
            'INTERNSHIP:registration': 'KP03',          // คพ.03 - ลงทะเบียน
            'INTERNSHIP:evaluation': 'KP04',            // คพ.04 - ประเมินผล
            'INTERNSHIP:report': 'report',              // alias
            
            // เอกสารโครงงานพิเศษ 1 (ตาม deadlineTemplates.js)
            'PROJECT:proposal': 'PROJECT1_PROPOSAL',    // เค้าโครงโครงงาน
            'PROJECT:defense_request': 'PROJECT1_DEFENSE_REQUEST', // คำขอสอบโครงงาน 1
            
            // เอกสารปริญญานิพนธ์ (ตาม deadlineTemplates.js)
            'THESIS:defense_request': 'THESIS_DEFENSE_REQUEST',   // คำขอสอบปริญญานิพนธ์
            'THESIS:system_test': 'PROJECT_SYSTEM_TEST_REQUEST',  // ทดสอบระบบ
            'THESIS:final': 'THESIS_FINAL_REPORT',                // รายงานฉบับสมบูรณ์
            
            // เอกสารโครงงานแบบเดิม (backward compatibility)
            'PROJECT:progress': 'PROJECT_PROGRESS',
            'PROJECT:final': 'PROJECT_FINAL',
            'PROJECT:acceptance': 'PROJECT_ACCEPTANCE'
        };

        const key = `${documentType?.toUpperCase()}:${category?.toLowerCase()}`;
        return mapping[key] || null;
    }

    /**
     * คาดเดา workflow_type จาก documentType
     */
    _inferWorkflowType(documentType) {
        if (documentType?.toUpperCase() === 'INTERNSHIP') {
            return 'internship';
        }
        if (documentType?.toUpperCase() === 'PROJECT') {
            return 'project1'; // หรือ project2 ตามการตั้งค่า
        }
        return null;
    }

    /**
     * Auto-assign deadline ให้กับเอกสารที่ยังไม่มี deadline
     * @param {Object} document - Document instance
     * @param {Object} contextData - { workflowType, academicYear, semester }
     */
    async autoAssignToDocument(document, contextData = {}) {
        if (document.importantDeadlineId) {
            return; // มี deadline แล้ว ข้าม
        }

        const deadlineId = await this.findMatchingDeadline({
            documentType: document.documentType,
            category: document.category,
            workflowType: contextData.workflowType,
            academicYear: contextData.academicYear,
            semester: contextData.semester
        });

        if (deadlineId) {
            await document.update({ importantDeadlineId: deadlineId });
            logger.info('[DeadlineAutoAssign] Auto-assigned deadline:', {
                documentId: document.documentId,
                deadlineId
            });
        }
    }

    /**
     * สร้าง mapping configuration พื้นฐาน
     * ใช้เมื่อต้องการ seed ข้อมูล mappings
     */
    async seedDefaultMappings(academicYear, semester) {
        const mappings = [
            // ตัวอย่าง mappings สำหรับฝึกงาน
            // ต้องสร้าง deadline ก่อน แล้วเอา ID มาใส่
            // {
            //     importantDeadlineId: 1, // deadline สำหรับส่ง คพ.01
            //     workflowType: 'internship',
            //     documentSubtype: 'KP01',
            //     autoAssign: 'on_submit',
            //     active: true
            // }
        ];

        logger.warn('[DeadlineAutoAssign] seedDefaultMappings ต้องกำหนด deadlines ก่อน');
        return mappings;
    }
}

module.exports = new DeadlineAutoAssignService();
