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
    await queryInterface.addColumn('internship_logbooks', 'supervisor_approved_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('internship_logbooks', 'supervisor_rejected_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('internship_logbooks', 'supervisor_approved_at');
    await queryInterface.removeColumn('internship_logbooks', 'supervisor_rejected_at');
  }
};
