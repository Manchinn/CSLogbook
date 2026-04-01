'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('project_documents', 'purged_at', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null,
      comment: 'Timestamp when bulky data (artifacts, milestones, tracks, meetings) was purged. NULL = not purged yet.'
    });

    await queryInterface.addIndex('project_documents', ['purged_at'], {
      name: 'idx_project_documents_purged_at'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('project_documents', 'idx_project_documents_purged_at');
    await queryInterface.removeColumn('project_documents', 'purged_at');
  }
};
