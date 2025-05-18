'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.changeColumn('approval_tokens', 'supervisor_id', {
      type: Sequelize.STRING, // หรือ Sequelize.STRING(255) ตามความเหมาะสม
      allowNull: false,
    });
  },

  async down (queryInterface, Sequelize) {
    // คำสั่งสำหรับ revert การเปลี่ยนแปลง (สำคัญมาก)
    await queryInterface.changeColumn('approval_tokens', 'supervisor_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
  }
};
