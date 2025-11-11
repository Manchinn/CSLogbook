'use strict';

/**
 * Migration: เพิ่ม phase_key และ phase_variant ให้ workflow_step_definitions
 * เพื่อเชื่อมกับ project_workflow_states โดยไม่ต้องใช้ตารางกลาง
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('workflow_step_definitions', 'phase_key', {
      type: Sequelize.STRING(64),
      allowNull: true,
      comment: 'Phase key ใน project_workflow_states ที่ step นี้สอดคล้อง'
    });

    await queryInterface.addColumn('workflow_step_definitions', 'phase_variant', {
      type: Sequelize.ENUM('default', 'late', 'overdue'),
      allowNull: false,
      defaultValue: 'default',
      comment: 'ชนิดของ step สำหรับ phase (default/late/overdue)'
    });

    await queryInterface.addIndex('workflow_step_definitions', ['workflow_type', 'phase_key', 'phase_variant'], {
      name: 'idx_workflow_steps_phase_variant'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('workflow_step_definitions', 'idx_workflow_steps_phase_variant');
    await queryInterface.removeColumn('workflow_step_definitions', 'phase_key');
    await queryInterface.removeColumn('workflow_step_definitions', 'phase_variant');
  }
};

