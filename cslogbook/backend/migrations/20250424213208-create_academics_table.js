"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("academics", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      academic_year: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      current_semester: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      semester1_range: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      semester2_range: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      semester3_range: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      internship_registration: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      project_registration: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      internship_semesters: {
        type: Sequelize.JSON, // เปลี่ยนจาก ARRAY เป็น JSON
        allowNull: true,
      },
      project_semesters: {
        type: Sequelize.JSON, // เปลี่ยนจาก ARRAY เป็น JSON
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("academics");
  },
};