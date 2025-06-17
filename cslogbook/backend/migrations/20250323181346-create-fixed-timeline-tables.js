'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. สร้างตาราง important_deadlines
    await queryInterface.createTable('important_deadlines', {
      important_deadline_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      related_to: {
        type: Sequelize.ENUM('internship', 'project', 'general'),
        allowNull: false
      },
      academic_year: {
        type: Sequelize.STRING(10),
        allowNull: false
      },
      semester: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      is_global: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
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

    // 2. สร้างตาราง student_progress
    await queryInterface.createTable('student_progress', {
      student_progress_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      student_id: {
        type: Sequelize.INTEGER, // ตรวจสอบให้แน่ใจว่าตรงกับตาราง students
        allowNull: false,
        references: {
          model: 'students',
          key: 'student_id' // คาดว่า primary key ในตาราง students เป็น 'id'
        }
      },
      progress_type: {
        type: Sequelize.ENUM('internship', 'project'),
        allowNull: false
      },
      current_step: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      total_steps: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      progress_percent: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      is_blocked: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      block_reason: {
        type: Sequelize.TEXT
      },
      next_action: {
        type: Sequelize.STRING(100)
      },
      last_updated: {
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

    // 3. สร้างตาราง timeline_steps
    await queryInterface.createTable('timeline_steps', {
      timestamps_id: { // ตามที่กำหนดในโมเดล TimelineStep
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      student_id: {
        type: Sequelize.INTEGER, // ตรวจสอบให้แน่ใจว่าตรงกับตาราง students
        allowNull: false,
        references: {
          model: 'students',
          key: 'student_id' // คาดว่า primary key ในตาราง students เป็น 'id'
        }
      },
      type: {
        type: Sequelize.ENUM('internship', 'project'),
        allowNull: false
      },
      step_order: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('waiting', 'in_progress', 'completed', 'blocked'),
        defaultValue: 'waiting'
      },
      date: {
        type: Sequelize.DATEONLY
      },
      start_date: {
        type: Sequelize.DATEONLY
      },
      end_date: {
        type: Sequelize.DATEONLY
      },
      deadline: {
        type: Sequelize.DATEONLY
      },
      description: {
        type: Sequelize.TEXT
      },
      document_type: {
        type: Sequelize.STRING(50)
      },
      action_text: {
        type: Sequelize.STRING(100)
      },
      action_link: {
        type: Sequelize.STRING(255)
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

    // เพิ่ม indexes
    await queryInterface.addIndex('timeline_steps', ['student_id', 'type', 'step_order']);
    await queryInterface.addIndex('student_progress', ['student_id', 'progress_type']);
    await queryInterface.addIndex('important_deadlines', ['academic_year', 'semester', 'related_to']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('timeline_steps');
    await queryInterface.dropTable('student_progress');
    await queryInterface.dropTable('important_deadlines');
  }
};