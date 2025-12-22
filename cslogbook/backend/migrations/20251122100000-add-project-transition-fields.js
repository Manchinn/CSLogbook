'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add columns to track Project 1 → Project 2 transition
    await queryInterface.addColumn('project_documents', 'transitioned_to_project2', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether this Project 1 has transitioned to Project 2'
    });

    await queryInterface.addColumn('project_documents', 'transitioned_at', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Timestamp when transition to Project 2 occurred'
    });

    await queryInterface.addColumn('project_documents', 'originated_from_project_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'project_documents',
        key: 'project_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'If this is Project 2, link to original Project 1'
    });

    // Add index for performance
    await queryInterface.addIndex('project_documents', ['transitioned_to_project2'], {
      name: 'idx_project_transitioned'
    });

    await queryInterface.addIndex('project_documents', ['originated_from_project_id'], {
      name: 'idx_project_originated_from'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes first
    await queryInterface.removeIndex('project_documents', 'idx_project_transitioned');
    await queryInterface.removeIndex('project_documents', 'idx_project_originated_from');
    
    // Remove columns
    await queryInterface.removeColumn('project_documents', 'transitioned_to_project2');
    await queryInterface.removeColumn('project_documents', 'transitioned_at');
    await queryInterface.removeColumn('project_documents', 'originated_from_project_id');
  }
};
