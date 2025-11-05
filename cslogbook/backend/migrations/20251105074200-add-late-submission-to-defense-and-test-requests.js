'use strict';

/**
 * Migration: Add Late Submission Tracking to Defense and Test Requests
 * 
 * เพิ่ม fields สำหรับ track การส่งคำร้องสาย:
 * - submitted_late: ส่งหลังเวลากำหนดหรือไม่
 * - submission_delay_minutes: จำนวนนาทีที่ส่งช้า
 * - important_deadline_id: FK เชื่อมกับ deadline
 * 
 * Tables: project_defense_requests, project_test_requests
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Helper function to check if column exists
    const columnExists = async (tableName, columnName) => {
      const [results] = await queryInterface.sequelize.query(
        `SHOW COLUMNS FROM ${tableName} LIKE '${columnName}'`
      );
      return results.length > 0;
    };

    // Helper function to check if index exists
    const indexExists = async (tableName, indexName) => {
      const [results] = await queryInterface.sequelize.query(
        `SHOW INDEX FROM ${tableName} WHERE Key_name = '${indexName}'`
      );
      return results.length > 0;
    };

    // ========== Table: project_defense_requests ==========
    console.log('Adding late submission tracking to project_defense_requests...');
    
    if (!(await columnExists('project_defense_requests', 'submitted_late'))) {
      await queryInterface.addColumn('project_defense_requests', 'submitted_late', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'ส่งคำร้องหลังเวลากำหนดหรือไม่ (Google Classroom style)'
      });
    }

    if (!(await columnExists('project_defense_requests', 'submission_delay_minutes'))) {
      await queryInterface.addColumn('project_defense_requests', 'submission_delay_minutes', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null,
        comment: 'จำนวนนาทีที่ส่งช้า (null = ส่งทันหรือไม่ได้ track)'
      });
    }

    if (!(await columnExists('project_defense_requests', 'important_deadline_id'))) {
      await queryInterface.addColumn('project_defense_requests', 'important_deadline_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null,
        references: {
          model: 'important_deadlines',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'เชื่อมโยงกับ deadline ที่ใช้ตรวจสอบ'
      });
    }

    // Index สำหรับ query performance
    if (!(await indexExists('project_defense_requests', 'idx_defense_requests_submitted_late'))) {
      await queryInterface.addIndex('project_defense_requests', ['submitted_late'], {
        name: 'idx_defense_requests_submitted_late'
      });
    }

    if (!(await indexExists('project_defense_requests', 'idx_defense_requests_deadline_id'))) {
      await queryInterface.addIndex('project_defense_requests', ['important_deadline_id'], {
        name: 'idx_defense_requests_deadline_id'
      });
    }

    // ========== Table: project_test_requests ==========
    console.log('Adding late submission tracking to project_test_requests...');
    
    if (!(await columnExists('project_test_requests', 'submitted_late'))) {
      await queryInterface.addColumn('project_test_requests', 'submitted_late', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'ส่งคำขอหลังเวลากำหนดหรือไม่ (Google Classroom style)'
      });
    }

    if (!(await columnExists('project_test_requests', 'submission_delay_minutes'))) {
      await queryInterface.addColumn('project_test_requests', 'submission_delay_minutes', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null,
        comment: 'จำนวนนาทีที่ส่งช้า (null = ส่งทันหรือไม่ได้ track)'
      });
    }

    if (!(await columnExists('project_test_requests', 'important_deadline_id'))) {
      await queryInterface.addColumn('project_test_requests', 'important_deadline_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null,
        references: {
          model: 'important_deadlines',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'เชื่อมโยงกับ deadline ที่ใช้ตรวจสอบ'
      });
    }

    // Index สำหรับ query performance
    if (!(await indexExists('project_test_requests', 'idx_test_requests_submitted_late'))) {
      await queryInterface.addIndex('project_test_requests', ['submitted_late'], {
        name: 'idx_test_requests_submitted_late'
      });
    }

    if (!(await indexExists('project_test_requests', 'idx_test_requests_deadline_id'))) {
      await queryInterface.addIndex('project_test_requests', ['important_deadline_id'], {
        name: 'idx_test_requests_deadline_id'
      });
    }

    console.log('✅ Migration completed: Late submission tracking added to defense and test requests');
  },

  async down(queryInterface, Sequelize) {
    // Helper function to check if index exists
    const indexExists = async (tableName, indexName) => {
      const [results] = await queryInterface.sequelize.query(
        `SHOW INDEX FROM ${tableName} WHERE Key_name = '${indexName}'`
      );
      return results.length > 0;
    };

    // ========== Rollback: project_defense_requests ==========
    console.log('Rolling back project_defense_requests...');
    
    if (await indexExists('project_defense_requests', 'idx_defense_requests_submitted_late')) {
      await queryInterface.removeIndex('project_defense_requests', 'idx_defense_requests_submitted_late');
    }
    if (await indexExists('project_defense_requests', 'idx_defense_requests_deadline_id')) {
      await queryInterface.removeIndex('project_defense_requests', 'idx_defense_requests_deadline_id');
    }
    
    await queryInterface.removeColumn('project_defense_requests', 'submitted_late');
    await queryInterface.removeColumn('project_defense_requests', 'submission_delay_minutes');
    await queryInterface.removeColumn('project_defense_requests', 'important_deadline_id');

    // ========== Rollback: project_test_requests ==========
    console.log('Rolling back project_test_requests...');
    
    if (await indexExists('project_test_requests', 'idx_test_requests_submitted_late')) {
      await queryInterface.removeIndex('project_test_requests', 'idx_test_requests_submitted_late');
    }
    if (await indexExists('project_test_requests', 'idx_test_requests_deadline_id')) {
      await queryInterface.removeIndex('project_test_requests', 'idx_test_requests_deadline_id');
    }
    
    await queryInterface.removeColumn('project_test_requests', 'submitted_late');
    await queryInterface.removeColumn('project_test_requests', 'submission_delay_minutes');
    await queryInterface.removeColumn('project_test_requests', 'important_deadline_id');

    console.log('✅ Migration rollback completed: Late submission tracking removed from defense and test requests');
  }
};

