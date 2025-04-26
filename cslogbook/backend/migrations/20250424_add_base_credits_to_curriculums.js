'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('curriculums', 'internship_base_credits', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('curriculums', 'project_base_credits', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('curriculums', 'project_major_base_credits', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('curriculums', 'internship_base_credits');
    await queryInterface.removeColumn('curriculums', 'project_base_credits');
    await queryInterface.removeColumn('curriculums', 'project_major_base_credits');
  }
};