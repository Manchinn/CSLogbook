// migration สำหรับลบ column student_year ออกจาก students
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // ลบ column student_year
    await queryInterface.removeColumn('students', 'student_year');
  },

  down: async (queryInterface, Sequelize) => {
    // เพิ่ม column student_year กลับคืน (INT, nullable, default: 1)
    await queryInterface.addColumn('students', 'student_year', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 1
    });
  }
}; 