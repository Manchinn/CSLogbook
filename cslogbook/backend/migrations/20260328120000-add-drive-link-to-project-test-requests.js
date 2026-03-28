"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("project_test_requests", "evidence_drive_link", {
      type: Sequelize.STRING(500),
      allowNull: true,
      defaultValue: null,
      after: "evidence_submitted_at",
    });

    await queryInterface.addColumn("documents", "drive_link", {
      type: Sequelize.STRING(500),
      allowNull: true,
      defaultValue: null,
      after: "file_path",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("project_test_requests", "evidence_drive_link");
    await queryInterface.removeColumn("documents", "drive_link");
  },
};
