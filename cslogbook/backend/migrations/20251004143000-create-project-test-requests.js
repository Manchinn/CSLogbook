'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('project_test_requests', {
      request_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      project_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'project_documents',
          key: 'project_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      submitted_by_student_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'students',
          key: 'student_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      status: {
        type: Sequelize.ENUM(
          'pending_advisor',
          'advisor_rejected',
          'pending_staff',
          'staff_rejected',
          'staff_approved'
        ),
        allowNull: false,
        defaultValue: 'pending_advisor'
      },
      request_file_path: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      request_file_name: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      student_note: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      submitted_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      },
      test_start_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      test_due_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      advisor_teacher_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'teachers',
          key: 'teacher_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      advisor_decision_note: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      advisor_decided_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      staff_user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'user_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      staff_decision_note: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      staff_decided_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      evidence_file_path: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      evidence_file_name: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      evidence_submitted_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      }
    });

    await queryInterface.addIndex('project_test_requests', ['project_id'], {
      name: 'idx_project_test_requests_project_id'
    });
    await queryInterface.addIndex('project_test_requests', ['status'], {
      name: 'idx_project_test_requests_status'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('project_test_requests');
    try {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_project_test_requests_status";');
    } catch (error) {
      // ignore for dialects without enum
    }
  }
};
