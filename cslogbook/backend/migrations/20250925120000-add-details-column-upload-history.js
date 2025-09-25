'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDefinition = await queryInterface.describeTable('upload_history');

    if (!tableDefinition.details) {
      await queryInterface.addColumn('upload_history', 'details', {
        type: Sequelize.JSON,
        allowNull: true
      });
    }
  },

  async down(queryInterface) {
    const tableDefinition = await queryInterface.describeTable('upload_history');

    if (tableDefinition.details) {
      await queryInterface.removeColumn('upload_history', 'details');
    }
  }
};
