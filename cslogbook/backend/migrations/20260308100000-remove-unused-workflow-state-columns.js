'use strict';

/**
 * ลบ 4 columns ที่ไม่ได้ใช้งานจาก project_workflow_states:
 * - topic_defense_status: snapshot only, ไม่มี code อ่านค่า
 * - thesis_defense_status: snapshot only, ไม่มี code อ่านค่า
 * - system_test_status: ไม่เคยถูกเขียน (NULL ทั้งหมด)
 * - final_document_status: ไม่เคยถูกเขียน (NULL ทั้งหมด)
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.removeColumn('project_workflow_states', 'topic_defense_status');
    await queryInterface.removeColumn('project_workflow_states', 'thesis_defense_status');
    await queryInterface.removeColumn('project_workflow_states', 'system_test_status');
    await queryInterface.removeColumn('project_workflow_states', 'final_document_status');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('project_workflow_states', 'topic_defense_status', {
      type: Sequelize.STRING(50),
      allowNull: true
    });
    await queryInterface.addColumn('project_workflow_states', 'thesis_defense_status', {
      type: Sequelize.STRING(50),
      allowNull: true
    });
    await queryInterface.addColumn('project_workflow_states', 'system_test_status', {
      type: Sequelize.STRING(50),
      allowNull: true
    });
    await queryInterface.addColumn('project_workflow_states', 'final_document_status', {
      type: Sequelize.STRING(50),
      allowNull: true
    });
  }
};
