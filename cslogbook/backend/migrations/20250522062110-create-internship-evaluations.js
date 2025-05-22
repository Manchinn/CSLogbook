'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('internship_evaluations', {
      evaluation_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      approval_token_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'approval_tokens', // Name of the ApprovalToken table
          key: 'token_id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL', // Or 'CASCADE' depending on desired behavior
      },
      internship_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'internship_documents', // Name of the InternshipDocument table
          key: 'internship_id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      student_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'students', // Name of the Student table
          key: 'student_id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      evaluator_name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      evaluation_date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      q1_knowledge: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      q2_responsibility: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      q3_initiative: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      q4_adaptability: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      q5_problem_solving: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      q6_communication: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      q7_punctuality: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      q8_personality: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      overall_score: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
      },
      strengths: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      weaknesses_to_improve: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      additional_comments: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      overall_grade: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      status: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'submitted_by_supervisor',
      },
      evaluated_by_supervisor_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    // Add indexes for frequently queried columns if needed
    // await queryInterface.addIndex('internship_evaluations', ['approval_token_id']);
    // await queryInterface.addIndex('internship_evaluations', ['internship_id']);
    // await queryInterface.addIndex('internship_evaluations', ['student_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('internship_evaluations');
  }
};