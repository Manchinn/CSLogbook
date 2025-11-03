'use strict';

/**
 * Migration: สร้าง view สำหรับภาพรวมสถานะโครงงาน
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
