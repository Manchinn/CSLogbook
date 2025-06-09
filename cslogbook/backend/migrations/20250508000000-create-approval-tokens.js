'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('approval_tokens', {
      token_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      token: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      log_id: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      supervisor_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      student_id: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('single', 'weekly', 'monthly', 'full'),
        defaultValue: 'single',
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending',
        allowNull: false
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      comment: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // สร้าง index เพื่อเพิ่มประสิทธิภาพในการค้นหา
    await queryInterface.addIndex('approval_tokens', ['token']);
    await queryInterface.addIndex('approval_tokens', ['student_id']);
    await queryInterface.addIndex('approval_tokens', ['supervisor_id']);
    await queryInterface.addIndex('approval_tokens', ['status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('approval_tokens');
  }
};