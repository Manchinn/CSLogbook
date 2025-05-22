'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.changeColumn('documents', 'status', {
      type: Sequelize.ENUM('draft', 'pending', 'approved', 'rejected', 'supervisor_evaluated'),
      allowNull: false,
      defaultValue: 'draft'
    });
  },

  async down (queryInterface, Sequelize) {
    // Revert to the old ENUM values if needed. 
    // Note: This might fail if there are records with 'supervisor_evaluated' status.
    await queryInterface.changeColumn('documents', 'status', {
      type: Sequelize.ENUM('draft', 'pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'draft'
    });
  }
};
