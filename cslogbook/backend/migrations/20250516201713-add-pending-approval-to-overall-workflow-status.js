'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.changeColumn('student_workflow_activities', 'overall_workflow_status', {
      type: Sequelize.ENUM('not_started', 'eligible', 'enrolled', 'pending_approval', 'in_progress', 'completed', 'blocked'),
      allowNull: false, // ตรวจสอบให้ตรงกับการตั้งค่าเดิม
      defaultValue: 'not_started' // ตรวจสอบให้ตรงกับการตั้งค่าเดิม
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    // โค้ดสำหรับ rollback (นำ 'pending_approval' ออก)
    await queryInterface.changeColumn('student_workflow_activities', 'overall_workflow_status', {
      type: Sequelize.ENUM('not_started', 'eligible', 'enrolled', 'in_progress', 'completed', 'blocked'),
      allowNull: false, // ตรวจสอบให้ตรงกับการตั้งค่าเดิม
      defaultValue: 'not_started' // ตรวจสอบให้ตรงกับการตั้งค่าเดิม
    });
  }
};
