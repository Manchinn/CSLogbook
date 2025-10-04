'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('project_test_requests', 'request_file_path', {
      type: Sequelize.STRING(500),
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('project_test_requests', 'request_file_path', {
      type: Sequelize.STRING(500),
      allowNull: false
    });
  }
};
