'use strict';

/**
 * อัปเดต ENUM status ของตาราง documents เพื่อรองรับสถานะ supervisor_evaluated
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('documents', 'status', {
      type: Sequelize.ENUM('draft', 'pending', 'approved', 'rejected', 'supervisor_evaluated'),
      allowNull: false,
      defaultValue: 'draft'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('documents', 'status', {
      type: Sequelize.ENUM('draft', 'pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'draft'
    });
  }
};
