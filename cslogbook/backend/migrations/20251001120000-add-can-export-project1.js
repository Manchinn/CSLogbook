"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('teachers', 'can_export_project1', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      after: 'can_access_topic_exam'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('teachers', 'can_export_project1');
  }
};
