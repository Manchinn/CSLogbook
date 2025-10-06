'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('project_milestones', {
      milestone_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      project_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'project_documents', key: 'project_id' },
        onDelete: 'CASCADE'
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      due_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      progress: {
        type: Sequelize.TINYINT,
        allowNull: false,
        defaultValue: 0
      },
      status: {
        // Phase 1 ใช้แค่ 'pending' ไว้ขยายใน Phase ถัดไป
        type: Sequelize.ENUM('pending','submitted','accepted','rejected'),
        allowNull: false,
        defaultValue: 'pending'
      },
      feedback: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      submitted_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      reviewed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('project_milestones', ['project_id']);
    await queryInterface.addIndex('project_milestones', ['project_id','status']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('project_milestones');
  }
};
