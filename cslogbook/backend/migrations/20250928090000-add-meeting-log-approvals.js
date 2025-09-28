'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('meeting_logs', 'approval_status', {
      type: Sequelize.ENUM('pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending'
    });

    await queryInterface.addColumn('meeting_logs', 'approved_by', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'user_id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('meeting_logs', 'approved_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('meeting_logs', 'approval_note', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addIndex('meeting_logs', {
      fields: ['approval_status'],
      name: 'idx_meeting_log_approval_status'
    });

    await queryInterface.addIndex('meeting_logs', {
      fields: ['approved_by'],
      name: 'idx_meeting_log_approved_by'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('meeting_logs', 'idx_meeting_log_approved_by');
    await queryInterface.removeIndex('meeting_logs', 'idx_meeting_log_approval_status');

    await queryInterface.removeColumn('meeting_logs', 'approval_note');
    await queryInterface.removeColumn('meeting_logs', 'approved_at');
    await queryInterface.removeColumn('meeting_logs', 'approved_by');

    // ลบ ENUM column สุดท้ายหลังจากดึง index ออก
    await queryInterface.removeColumn('meeting_logs', 'approval_status');
  }
};
