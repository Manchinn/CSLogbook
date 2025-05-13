'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('student_workflow_activities', {
      activity_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      student_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'students',
          key: 'student_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      workflow_type: {
        type: Sequelize.ENUM('internship', 'project1', 'project2'),
        allowNull: false
      },
      current_step_key: {
        type: Sequelize.STRING,
        allowNull: false
      },
      current_step_status: {
        type: Sequelize.ENUM('pending', 'in_progress', 'awaiting_student_action', 
                            'awaiting_admin_action', 'completed', 'rejected', 'skipped'),
        allowNull: false,
        defaultValue: 'pending'
      },
      overall_workflow_status: {
        type: Sequelize.ENUM('not_started', 'eligible', 'enrolled', 'in_progress', 'completed', 'blocked'),
        allowNull: false,
        defaultValue: 'not_started'
      },
      data_payload: {
        type: Sequelize.JSON,
        allowNull: true
      },
      started_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // เพิ่ม Indexes
    await queryInterface.addIndex('student_workflow_activities', ['student_id'], {
      name: 'idx_student_workflow_student_id'
    });
    await queryInterface.addIndex('student_workflow_activities', ['workflow_type'], {
      name: 'idx_student_workflow_type'
    });
    await queryInterface.addIndex('student_workflow_activities', ['current_step_key'], {
      name: 'idx_student_workflow_current_step'
    });
    await queryInterface.addIndex('student_workflow_activities', ['student_id', 'workflow_type'], {
      name: 'uq_student_workflow_type',
      unique: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('student_workflow_activities');
  }
};