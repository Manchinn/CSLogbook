// migration สำหรับลบ column academic_year และ semester ออกจาก students
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // ลบ column academic_year
    await queryInterface.removeColumn('students', 'academic_year');
    // ลบ column semester
    await queryInterface.removeColumn('students', 'semester');
  },

  down: async (queryInterface, Sequelize) => {
    // เพิ่ม column academic_year กลับคืน (INT, not null, default: ปีปัจจุบันแบบไทย)
    await queryInterface.addColumn('students', 'academic_year', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: (new Date().getFullYear() + 543)
    });
    // เพิ่ม column semester กลับคืน (INT, not null, default: 1)
    await queryInterface.addColumn('students', 'semester', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1
    });
  }
}; 