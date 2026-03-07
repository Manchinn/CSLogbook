'use strict';

/**
 * เพิ่ม 'evidence_submitted' เข้า ENUM ของ project_test_requests.status
 * เดิม: pending_advisor, advisor_rejected, pending_staff, staff_rejected, staff_approved
 * ใหม่: + evidence_submitted (หลัง staff_approved เมื่อนักศึกษาอัปโหลดหลักฐานแล้ว)
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.changeColumn('project_test_requests', 'status', {
      type: `ENUM('pending_advisor', 'advisor_rejected', 'pending_staff', 'staff_rejected', 'staff_approved', 'evidence_submitted')`,
      allowNull: false,
      defaultValue: 'pending_advisor'
    });
  },

  async down(queryInterface) {
    // Revert rows back to staff_approved before shrinking ENUM
    await queryInterface.sequelize.query(
      `UPDATE project_test_requests SET status = 'staff_approved' WHERE status = 'evidence_submitted'`
    );
    await queryInterface.changeColumn('project_test_requests', 'status', {
      type: `ENUM('pending_advisor', 'advisor_rejected', 'pending_staff', 'staff_rejected', 'staff_approved')`,
      allowNull: false,
      defaultValue: 'pending_advisor'
    });
  }
};
