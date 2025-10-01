'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Trim ค่าและอัปเดตสถานะที่ไม่รู้จักให้เป็นค่าที่รองรับก่อนเปลี่ยน ENUM
    await queryInterface.sequelize.query(`
      UPDATE student_workflow_activities
      SET current_step_status = TRIM(current_step_status),
          overall_workflow_status = TRIM(overall_workflow_status)
    `);

    await queryInterface.sequelize.query(`
      UPDATE student_workflow_activities
      SET current_step_status = 'pending'
      WHERE current_step_status IS NULL
         OR current_step_status = ''
         OR current_step_status NOT IN (
           'pending',
           'in_progress',
           'awaiting_student_action',
           'awaiting_admin_action',
           'completed',
           'rejected',
           'skipped'
         )
    `);

    await queryInterface.sequelize.query(`
      UPDATE student_workflow_activities
      SET overall_workflow_status = 'in_progress'
      WHERE overall_workflow_status IS NULL
         OR overall_workflow_status = ''
         OR overall_workflow_status NOT IN (
           'not_started',
           'eligible',
           'enrolled',
           'in_progress',
           'completed',
           'blocked'
         )
    `);

    await queryInterface.changeColumn('student_workflow_activities', 'current_step_status', {
      type: Sequelize.ENUM(
        'pending',
        'in_progress',
        'awaiting_student_action',
        'awaiting_admin_action',
        'completed',
        'rejected',
        'skipped',
        'blocked'
      ),
      allowNull: false,
      defaultValue: 'pending'
    });

    await queryInterface.changeColumn('student_workflow_activities', 'overall_workflow_status', {
      type: Sequelize.ENUM(
        'not_started',
        'eligible',
        'enrolled',
        'in_progress',
        'completed',
        'blocked',
        'failed',
        'archived'
      ),
      allowNull: false,
      defaultValue: 'not_started'
    });
  },

  async down(queryInterface, Sequelize) {
    // จัดการ mapping ค่าที่ ENUM เก่าไม่รองรับก่อนย้อนกลับ
    await queryInterface.sequelize.query(`
      UPDATE student_workflow_activities
      SET current_step_status = 'rejected'
      WHERE current_step_status = 'blocked'
    `);

    await queryInterface.sequelize.query(`
      UPDATE student_workflow_activities
      SET overall_workflow_status = CASE overall_workflow_status
        WHEN 'failed' THEN 'blocked'
        WHEN 'archived' THEN 'completed'
        ELSE overall_workflow_status
      END
    `);

    await queryInterface.changeColumn('student_workflow_activities', 'current_step_status', {
      type: Sequelize.ENUM(
        'pending',
        'in_progress',
        'awaiting_student_action',
        'awaiting_admin_action',
        'completed',
        'rejected',
        'skipped'
      ),
      allowNull: false,
      defaultValue: 'pending'
    });

    await queryInterface.changeColumn('student_workflow_activities', 'overall_workflow_status', {
      type: Sequelize.ENUM(
        'not_started',
        'eligible',
        'enrolled',
        'in_progress',
        'completed',
        'blocked'
      ),
      allowNull: false,
      defaultValue: 'not_started'
    });
  }
};
