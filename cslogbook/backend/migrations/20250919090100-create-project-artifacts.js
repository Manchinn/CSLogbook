'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('project_artifacts', {
      artifact_id: {
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
      type: {
        type: Sequelize.STRING(50), // proposal/final/slide/appendix/source/other
        allowNull: false
      },
      file_path: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      original_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      mime_type: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      size: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      version: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      uploaded_by_student_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'students', key: 'student_id' }
      },
      checksum: {
        type: Sequelize.STRING(128),
        allowNull: true
      },
      uploaded_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
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

    await queryInterface.addIndex('project_artifacts', ['project_id','type']);
    await queryInterface.addConstraint('project_artifacts', {
      fields: ['project_id','type','version'],
      type: 'unique',
      name: 'uq_project_artifacts_project_type_version'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('project_artifacts');
  }
};
