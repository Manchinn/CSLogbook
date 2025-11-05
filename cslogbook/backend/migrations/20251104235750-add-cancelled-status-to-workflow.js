'use strict';

/**
 * Migration: เพิ่ม 'cancelled' เข้าไปใน ENUM ของคอลัมน์ current_step_status และ overall_workflow_status
 * ในตาราง student_workflow_activities
 * 
 * เหตุผล: รองรับการยกเลิกการฝึกงานโดยเจ้าหน้าที่ภาควิชา
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. เพิ่ม 'cancelled' เข้าไปใน current_step_status ENUM
    await queryInterface.sequelize.query(`
      ALTER TABLE student_workflow_activities 
      MODIFY COLUMN current_step_status ENUM(
        'pending',
        'in_progress',
        'awaiting_student_action',
        'awaiting_admin_action',
        'completed',
        'rejected',
        'skipped',
        'blocked',
        'cancelled'
      ) NOT NULL DEFAULT 'pending'
    `);

    // 2. เพิ่ม 'cancelled' เข้าไปใน overall_workflow_status ENUM
    await queryInterface.sequelize.query(`
      ALTER TABLE student_workflow_activities 
      MODIFY COLUMN overall_workflow_status ENUM(
        'not_started',
        'eligible',
        'enrolled',
        'in_progress',
        'completed',
        'blocked',
        'failed',
        'archived',
        'cancelled'
      ) NOT NULL DEFAULT 'not_started'
    `);
  },

  async down(queryInterface, Sequelize) {
    // ตรวจสอบว่ามีข้อมูลที่ใช้สถานะ 'cancelled' อยู่หรือไม่
    const [results] = await queryInterface.sequelize.query(
      "SELECT COUNT(*) as count FROM student_workflow_activities WHERE current_step_status = 'cancelled' OR overall_workflow_status = 'cancelled'"
    );
    
    const count = results[0].count;
    
    if (count > 0) {
      console.log(`Found ${count} workflow activities with 'cancelled' status. Converting to 'blocked'...`);
      
      // เปลี่ยน cancelled เป็น blocked ก่อน rollback
      await queryInterface.sequelize.query(
        "UPDATE student_workflow_activities SET current_step_status = 'blocked' WHERE current_step_status = 'cancelled'"
      );
      
      await queryInterface.sequelize.query(
        "UPDATE student_workflow_activities SET overall_workflow_status = 'blocked' WHERE overall_workflow_status = 'cancelled'"
      );
    }
    
    // 1. ลบ 'cancelled' ออกจาก current_step_status ENUM
    await queryInterface.sequelize.query(`
      ALTER TABLE student_workflow_activities 
      MODIFY COLUMN current_step_status ENUM(
        'pending',
        'in_progress',
        'awaiting_student_action',
        'awaiting_admin_action',
        'completed',
        'rejected',
        'skipped',
        'blocked'
      ) NOT NULL DEFAULT 'pending'
    `);

    // 2. ลบ 'cancelled' ออกจาก overall_workflow_status ENUM
    await queryInterface.sequelize.query(`
      ALTER TABLE student_workflow_activities 
      MODIFY COLUMN overall_workflow_status ENUM(
        'not_started',
        'eligible',
        'enrolled',
        'in_progress',
        'completed',
        'blocked',
        'failed',
        'archived'
      ) NOT NULL DEFAULT 'not_started'
    `);
  }
};
