'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // เพิ่มคอลัมน์ position (ตำแหน่ง) ในตาราง teachers
    await queryInterface.addColumn('teachers', 'position', {
      type: Sequelize.STRING(100),
      allowNull: false,
      defaultValue: 'คณาจารย์', // กำหนดค่าเริ่มต้นเป็น "คณาจารย์"
      after: 'teacher_type'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // ลบคอลัมน์ position
    await queryInterface.removeColumn('teachers', 'position');
  }
};
