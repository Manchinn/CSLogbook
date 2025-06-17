"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.createTable("notification_settings", {
      setting_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      notification_type: {
        type: Sequelize.ENUM(
          "LOGIN",
          "DOCUMENT",
          "LOGBOOK",
          "EVALUATION",
          "APPROVAL"
        ),
        allowNull: false,
        unique: true,
      },
      is_enabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      description: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      updated_by_admin: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "users",
          key: "user_id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        ),
      },
    });

    // เพิ่ม indexes โดยตรวจสอบว่ามีอยู่แล้วหรือไม่
    const indexes = await queryInterface.showIndex("notification_settings");
    const indexNames = indexes.map((index) => index.name);

    if (!indexNames.includes("idx_notification_type")) {
      await queryInterface.addIndex(
        "notification_settings",
        ["notification_type"],
        {
          unique: true,
          name: "idx_notification_type",
        }
      );
    }

    if (!indexNames.includes("idx_notification_enabled")) {
      await queryInterface.addIndex("notification_settings", ["is_enabled"], {
        name: "idx_notification_enabled",
      });
    }

    if (!indexNames.includes("idx_updated_by_admin")) {
      await queryInterface.addIndex(
        "notification_settings",
        ["updated_by_admin"],
        {
          name: "idx_updated_by_admin",
        }
      );
    }
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropTable("notification_settings");
  },
};
