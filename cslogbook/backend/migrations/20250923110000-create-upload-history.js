'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('upload_history', {
      history_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      uploaded_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      file_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      total_records: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      successful_updates: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      failed_updates: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      upload_type: {
        type: Sequelize.ENUM('students', 'grades'),
        allowNull: false,
        defaultValue: 'students'
      },
      details: {
        type: Sequelize.JSON,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('upload_history', ['uploaded_by'], {
      name: 'idx_upload_history_uploader'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('upload_history', 'idx_upload_history_uploader');
    await queryInterface.dropTable('upload_history');

    if (queryInterface.sequelize.getDialect() === 'postgres') {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_upload_history_upload_type";');
    }
  }
};
