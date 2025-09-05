'use strict';

/**
 * ลบคอลัมน์คะแนนเก่า (q1_knowledge..q8_personality) ที่เลิกใช้แล้ว
 * หมายเหตุ: ถ้าต้องการ rollback จะเพิ่มคอลัมน์กลับโดยไม่กู้ข้อมูลเดิม
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = 'internship_evaluations';
    const cols = [
      'q1_knowledge','q2_responsibility','q3_initiative','q4_adaptability',
      'q5_problem_solving','q6_communication','q7_punctuality','q8_personality'
    ];
    for (const c of cols) {
      try {
        await queryInterface.removeColumn(table, c);
      } catch (err) {
        console.warn(`[drop-old-eval-cols] Skip removing ${c}:`, err.message);
      }
    }
  },
  async down(queryInterface, Sequelize) {
    const table = 'internship_evaluations';
    // เพิ่มกลับเป็น INTEGER nullable
    await queryInterface.addColumn(table, 'q1_knowledge', { type: Sequelize.INTEGER, allowNull: true });
    await queryInterface.addColumn(table, 'q2_responsibility', { type: Sequelize.INTEGER, allowNull: true });
    await queryInterface.addColumn(table, 'q3_initiative', { type: Sequelize.INTEGER, allowNull: true });
    await queryInterface.addColumn(table, 'q4_adaptability', { type: Sequelize.INTEGER, allowNull: true });
    await queryInterface.addColumn(table, 'q5_problem_solving', { type: Sequelize.INTEGER, allowNull: true });
    await queryInterface.addColumn(table, 'q6_communication', { type: Sequelize.INTEGER, allowNull: true });
    await queryInterface.addColumn(table, 'q7_punctuality', { type: Sequelize.INTEGER, allowNull: true });
    await queryInterface.addColumn(table, 'q8_personality', { type: Sequelize.INTEGER, allowNull: true });
  }
};
