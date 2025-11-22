'use strict';

/**
 * Migration: Add workflow_step_id to project_workflow_states
 * 
 * Adds workflow_step_id column to support the new workflow system
 * with late/overdue state transitions based on WorkflowStepDefinition
 * 
 * IMPORTANT: This is a non-destructive migration
 * - Adds new column without dropping currentPhase
 * - Both systems can coexist during transition
 * - Existing data remains intact
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('Adding workflow_step_id column to project_workflow_states...');
    
    await queryInterface.addColumn('project_workflow_states', 'workflow_step_id', {
      type: Sequelize.INTEGER,
      allowNull: true, // Allow null during transition period
      references: {
        model: 'workflow_step_definitions',
        key: 'step_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Foreign key to workflow_step_definitions for new workflow system'
    });

    // Add index for performance
    await queryInterface.addIndex('project_workflow_states', ['workflow_step_id'], {
      name: 'idx_project_workflow_states_workflow_step_id'
    });

    console.log('✅ Successfully added workflow_step_id column');
    console.log('Note: currentPhase column is kept for backward compatibility');
  },

  down: async (queryInterface, Sequelize) => {
    console.log('Removing workflow_step_id column from project_workflow_states...');
    
    // Remove index first
    await queryInterface.removeIndex(
      'project_workflow_states', 
      'idx_project_workflow_states_workflow_step_id'
    );
    
    // Remove column
    await queryInterface.removeColumn('project_workflow_states', 'workflow_step_id');
    
    console.log('✅ Successfully removed workflow_step_id column');
  }
};
