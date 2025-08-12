// migration สำหรับเพิ่ม column academic_year และ semester ใน internship_logbooks
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // เพิ่ม column academic_year
    await queryInterface.addColumn('internship_logbooks', 'academic_year', {
      type: Sequelize.INTEGER,
      allowNull: false,
      comment: 'ปีการศึกษาที่ logbook นี้ถูกบันทึก',
      defaultValue: (new Date().getFullYear() + 543)
    });
    // เพิ่ม column semester
    await queryInterface.addColumn('internship_logbooks', 'semester', {
      type: Sequelize.INTEGER,
      allowNull: false,
      comment: 'ภาคเรียนที่ logbook นี้ถูกบันทึก (1, 2, 3)',
      defaultValue: 1
    });
  },

  down: async (queryInterface, Sequelize) => {
    // ลบ column academic_year
    await queryInterface.removeColumn('internship_logbooks', 'academic_year');
    // ลบ column semester
    await queryInterface.removeColumn('internship_logbooks', 'semester');
  }
}; 