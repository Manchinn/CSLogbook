"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("internship_logbook_reflections", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      internship_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "internship_documents",
          key: "internship_id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      student_id: {
        type: Sequelize.INTEGER, // เปลี่ยนจาก STRING เป็น INTEGER เพราะน่าจะเป็น integer ในตาราง students
        allowNull: false,
        references: {
          model: "students",
          key: "student_id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      learning_outcome: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      key_learnings: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      future_application: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      improvements: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // เพิ่ม index เพื่อให้เร็วขึ้น
    await queryInterface.addIndex("internship_logbook_reflections", [
      "internship_id",
    ]);
    await queryInterface.addIndex("internship_logbook_reflections", [
      "student_id",
    ]);
    await queryInterface.addIndex(
      "internship_logbook_reflections",
      ["internship_id", "student_id"],
      {
        unique: true,
        name: "idx_unique_student_internship_reflection",
      }
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("internship_logbook_reflections");
  },
};
