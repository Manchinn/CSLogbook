'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('project_events', {
      event_id: {
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
      event_type: {
        type: Sequelize.STRING(80),
        allowNull: false
      },
      actor_role: {
        type: Sequelize.STRING(40),
        allowNull: true
      },
      actor_user_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      meta_json: {
        type: Sequelize.JSON,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('project_events', ['project_id','event_type']);
    await queryInterface.addIndex('project_events', ['created_at']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('project_events');
  }
};
