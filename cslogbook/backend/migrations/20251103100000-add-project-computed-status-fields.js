'use strict';

/**
 * Migration: เพิ่มฟิลด์สำหรับเก็บสถานะที่คำนวณได้ (computed fields)
 * ถูกยกเลิกเพราะใช้ project_workflow_states แทน
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // ไม่ทำอะไร - ใช้ project_workflow_states แทน
  },

  async down(queryInterface, Sequelize) {
    // ไม่ทำอะไร
  }
};
