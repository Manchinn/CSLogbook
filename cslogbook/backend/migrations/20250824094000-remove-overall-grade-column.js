'use strict';

/**
 * ลบคอลัมน์ overall_grade ที่เลิกใช้งานแล้ว (ถูกถอดออกจาก Model)
 * หมายเหตุ: การย้อนกลับจะเพิ่มคอลัมน์กลับ (ข้อมูลเดิมไม่ถูกกู้คืน)
 */
module.exports = {
  async up(queryInterface) {
    try {
      await queryInterface.removeColumn('internship_evaluations', 'overall_grade');
    } catch (err) {
      console.warn('[remove-overall-grade] ไม่สามารถลบคอลัมน์ overall_grade หรืออาจถูกลบไปแล้ว:', err.message);
    }
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('internship_evaluations', 'overall_grade', {
      type: Sequelize.STRING(50),
      allowNull: true,
    });
  }
};
