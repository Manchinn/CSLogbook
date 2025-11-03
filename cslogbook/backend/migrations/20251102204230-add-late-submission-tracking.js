'use strict';

/**
 * Migration: Add Late Submission Tracking (Google Classroom Style)
 * 
 * เพิ่ม fields สำหรับ track การส่งงานสาย:
 * - submitted_late: ส่งหลังเวลากำหนดหรือไม่
 * - submission_delay_minutes: จำนวนนาทีที่ส่งช้า
 * - important_deadline_id: FK เชื่อมกับ deadline
 * 
 * Tables: documents, project_documents
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

    // ========== Table: documents ==========
    if (!(await columnExists('documents', 'submitted_late'))) {
      await queryInterface.addColumn('documents', 'submitted_late', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'ส่งงานหลังเวลากำหนดหรือไม่'
      });
    }

    if (!(await columnExists('documents', 'submission_delay_minutes'))) {
      await queryInterface.addColumn('documents', 'submission_delay_minutes', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null,
        comment: 'จำนวนนาทีที่ส่งช้า (null = ส่งทันหรือไม่ได้ track)'
      });
    }

    if (!(await columnExists('documents', 'important_deadline_id'))) {
      await queryInterface.addColumn('documents', 'important_deadline_id', {
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
    if (!(await indexExists('documents', 'idx_documents_submitted_late'))) {
      await queryInterface.addIndex('documents', ['submitted_late'], {
        name: 'idx_documents_submitted_late'
      });
    }

    if (!(await indexExists('documents', 'idx_documents_deadline_id'))) {
      await queryInterface.addIndex('documents', ['important_deadline_id'], {
        name: 'idx_documents_deadline_id'
      });
    }

    // ========== Table: project_documents ==========
    await queryInterface.addColumn('project_documents', 'submitted_late', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'ส่งงานหลังเวลากำหนดหรือไม่'
    });

    await queryInterface.addColumn('project_documents', 'submission_delay_minutes', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: null,
      comment: 'จำนวนนาทีที่ส่งช้า (null = ส่งทันหรือไม่ได้ track)'
    });

    await queryInterface.addColumn('project_documents', 'important_deadline_id', {
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

    // Index สำหรับ query performance
    await queryInterface.addIndex('project_documents', ['submitted_late'], {
      name: 'idx_project_documents_submitted_late'
    });

    await queryInterface.addIndex('project_documents', ['important_deadline_id'], {
      name: 'idx_project_documents_deadline_id'
    });

    console.log('✅ Migration completed: Late submission tracking added');
  },

  async down(queryInterface, Sequelize) {
    // ========== Rollback: documents ==========
    await queryInterface.removeIndex('documents', 'idx_documents_submitted_late');
    await queryInterface.removeIndex('documents', 'idx_documents_deadline_id');
    await queryInterface.removeColumn('documents', 'submitted_late');
    await queryInterface.removeColumn('documents', 'submission_delay_minutes');
    await queryInterface.removeColumn('documents', 'important_deadline_id');

    // ========== Rollback: project_documents ==========
    await queryInterface.removeIndex('project_documents', 'idx_project_documents_submitted_late');
    await queryInterface.removeIndex('project_documents', 'idx_project_documents_deadline_id');
    await queryInterface.removeColumn('project_documents', 'submitted_late');
    await queryInterface.removeColumn('project_documents', 'submission_delay_minutes');
    await queryInterface.removeColumn('project_documents', 'important_deadline_id');

    console.log('✅ Migration rollback completed: Late submission tracking removed');
  }
};
