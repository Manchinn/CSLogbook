"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("documents", "official_number", {
      type: Sequelize.STRING(10),
      allowNull: true,
      defaultValue: null,
      after: "review_comment",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("documents", "official_number");
  },
};
