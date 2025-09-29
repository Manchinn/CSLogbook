'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("project_defense_requests", {
      request_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      project_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "project_documents",
          key: "project_id"
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      defense_type: {
        type: Sequelize.ENUM("PROJECT1", "THESIS"),
        allowNull: false,
        defaultValue: "PROJECT1"
      },
      status: {
        type: Sequelize.ENUM("draft", "submitted", "cancelled"),
        allowNull: false,
        defaultValue: "submitted"
      },
      form_payload: {
        type: Sequelize.JSON,
        allowNull: false
      },
      submitted_by_student_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "students",
          key: "student_id"
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT"
      },
      submitted_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW")
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW")
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW")
      }
    });

    await queryInterface.addConstraint("project_defense_requests", {
      type: "unique",
      fields: ["project_id", "defense_type"],
      name: "uniq_project_defense_request"
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("project_defense_requests");
    try {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_project_defense_requests_defense_type";');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_project_defense_requests_status";');
    } catch (error) {
      // ignore for MySQL
    }
  }
};
