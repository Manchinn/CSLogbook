'use strict';

/**
 * Migration: เพิ่ม 'cancelled' status เข้าไปใน ProjectDocument.status และ ProjectWorkflowState.currentPhase
 * 
 * เหตุผล: รองรับการยกเลิกโครงงานพิเศษโดยเจ้าหน้าที่ภาควิชา
 * - นักศึกษาจะสามารถส่งเสนอหัวข้อโครงงานพิเศษได้ใหม่ในภาคการศึกษาถัดไป
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. เพิ่ม 'cancelled' เข้าไปใน ProjectDocument.status ENUM
    await queryInterface.sequelize.query(`
      ALTER TABLE project_documents 
      MODIFY COLUMN status ENUM(
        'draft',
        'advisor_assigned',
        'in_progress',
        'completed',
        'archived',
        'cancelled'
      ) NOT NULL DEFAULT 'draft'
    `);

    // 2. เพิ่ม 'CANCELLED' เข้าไปใน ProjectWorkflowState.currentPhase ENUM
    await queryInterface.sequelize.query(`
      ALTER TABLE project_workflow_states 
      MODIFY COLUMN current_phase ENUM(
        'DRAFT',
        'PENDING_ADVISOR',
        'ADVISOR_ASSIGNED',
        'TOPIC_SUBMISSION',
        'TOPIC_EXAM_PENDING',
        'TOPIC_EXAM_SCHEDULED',
        'TOPIC_FAILED',
        'IN_PROGRESS',
        'THESIS_SUBMISSION',
        'THESIS_EXAM_PENDING',
        'THESIS_EXAM_SCHEDULED',
        'THESIS_FAILED',
        'COMPLETED',
        'ARCHIVED',
        'CANCELLED'
      ) NOT NULL DEFAULT 'DRAFT'
    `);
  },

  async down(queryInterface, Sequelize) {
    // ตรวจสอบว่ามีข้อมูลที่ใช้สถานะ 'cancelled' หรือ 'CANCELLED' อยู่หรือไม่
    const [projectResults] = await queryInterface.sequelize.query(
      "SELECT COUNT(*) as count FROM project_documents WHERE status = 'cancelled'"
    );
    
    const [workflowResults] = await queryInterface.sequelize.query(
      "SELECT COUNT(*) as count FROM project_workflow_states WHERE current_phase = 'CANCELLED'"
    );
    
    const projectCount = projectResults[0].count;
    const workflowCount = workflowResults[0].count;
    
    if (projectCount > 0) {
      console.log(`Found ${projectCount} projects with 'cancelled' status. Converting to 'archived'...`);
      await queryInterface.sequelize.query(
        "UPDATE project_documents SET status = 'archived' WHERE status = 'cancelled'"
      );
    }
    
    if (workflowCount > 0) {
      console.log(`Found ${workflowCount} workflow states with 'CANCELLED' phase. Converting to 'ARCHIVED'...`);
      await queryInterface.sequelize.query(
        "UPDATE project_workflow_states SET current_phase = 'ARCHIVED' WHERE current_phase = 'CANCELLED'"
      );
    }
    
    // 1. ลบ 'cancelled' ออกจาก ProjectDocument.status ENUM
    await queryInterface.sequelize.query(`
      ALTER TABLE project_documents 
      MODIFY COLUMN status ENUM(
        'draft',
        'advisor_assigned',
        'in_progress',
        'completed',
        'archived'
      ) NOT NULL DEFAULT 'draft'
    `);

    // 2. ลบ 'CANCELLED' ออกจาก ProjectWorkflowState.currentPhase ENUM
    await queryInterface.sequelize.query(`
      ALTER TABLE project_workflow_states 
      MODIFY COLUMN current_phase ENUM(
        'DRAFT',
        'PENDING_ADVISOR',
        'ADVISOR_ASSIGNED',
        'TOPIC_SUBMISSION',
        'TOPIC_EXAM_PENDING',
        'TOPIC_EXAM_SCHEDULED',
        'TOPIC_FAILED',
        'IN_PROGRESS',
        'THESIS_SUBMISSION',
        'THESIS_EXAM_PENDING',
        'THESIS_EXAM_SCHEDULED',
        'THESIS_FAILED',
        'COMPLETED',
        'ARCHIVED'
      ) NOT NULL DEFAULT 'DRAFT'
    `);
  }
};
