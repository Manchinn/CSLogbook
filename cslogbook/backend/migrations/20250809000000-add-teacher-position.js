'use strict';

/**
 * เพิ่มคอลัมน์ position ในตาราง teachers เพื่อระบุตำแหน่งวิชาการ/สายสนับสนุน
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('teachers', 'position', {
      type: Sequelize.STRING(100),
      allowNull: false,
      defaultValue: 'คณาจารย์',
      comment: 'ตำแหน่งหรือสายงานของอาจารย์',
      after: 'teacher_type'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('teachers', 'position');
  }
};
