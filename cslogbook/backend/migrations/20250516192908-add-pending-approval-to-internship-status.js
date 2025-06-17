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
    await queryInterface.changeColumn('students', 'internship_status', {
      type: Sequelize.ENUM('not_started', 'pending_approval', 'in_progress', 'completed'),
      defaultValue: 'not_started',
      allowNull: true // หรือ true ตามการออกแบบเดิม
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    // หากต้องการ rollback กลับไปสถานะเดิม
    await queryInterface.changeColumn('students', 'internship_status', {
      type: Sequelize.ENUM('not_started', 'in_progress', 'completed'),
      defaultValue: 'not_started',
      allowNull: true // หรือ true ตามการออกแบบเดิม
    });
  }
};
