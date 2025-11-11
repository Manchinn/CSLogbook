'use strict';

/**
 * Seeder: กำหนด phase_key ให้กับ workflow_step_definitions สำหรับโครงงานพิเศษ 1
 */

const PHASE_MAPPINGS = [
  {
    workflowType: 'project1',
    phaseKey: 'IN_PROGRESS',
    stepKey: 'PROJECT1_IN_PROGRESS',
    phaseVariant: 'default'
  },
  {
    workflowType: 'project1',
    phaseKey: 'TOPIC_EXAM_PENDING',
    stepKey: 'PROJECT1_DEFENSE_REQUEST',
    phaseVariant: 'default'
  },
  {
    workflowType: 'project1',
    phaseKey: 'TOPIC_EXAM_SCHEDULED',
    stepKey: 'PROJECT1_DEFENSE_SCHEDULED',
    phaseVariant: 'default'
  },
  {
    workflowType: 'project1',
    phaseKey: 'COMPLETED',
    stepKey: 'PROJECT1_DEFENSE_RESULT',
    phaseVariant: 'default'
  }
];

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      for (const mapping of PHASE_MAPPINGS) {
        await queryInterface.bulkUpdate(
          'workflow_step_definitions',
          {
            phase_key: mapping.phaseKey,
            phase_variant: mapping.phaseVariant || 'default',
            updated_at: new Date()
          },
          {
            workflow_type: mapping.workflowType,
            step_key: mapping.stepKey
          },
          { transaction }
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      for (const mapping of PHASE_MAPPINGS) {
        await queryInterface.bulkUpdate(
          'workflow_step_definitions',
          {
            phase_key: null,
            phase_variant: 'default',
            updated_at: new Date()
          },
          {
            workflow_type: mapping.workflowType,
            step_key: mapping.stepKey
          },
          { transaction }
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};