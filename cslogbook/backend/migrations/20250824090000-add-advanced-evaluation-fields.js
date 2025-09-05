'use strict';

/**
 * เพิ่มฟิลด์ใหม่สำหรับรูปแบบการประเมิน 5 หมวด (รวม 100 คะแนน) + การตัดสินผ่าน/ไม่ผ่าน
 * - evaluation_items (TEXT/JSON) เก็บรายละเอียดคะแนนย่อยทั้งหมด (20 รายการ)
 * - discipline_score, behavior_score, performance_score, method_score, relation_score (INTEGER 0-20)
 * - supervisor_pass_decision (BOOLEAN) การเลือกผ่าน/ไม่ผ่านโดยผู้ประเมิน
 * - pass_fail (STRING) 'pass' | 'fail' ผลสรุปตามเงื่อนไข (รวม >=70 และ supervisor_pass_decision = true)
 * - pass_evaluated_at (DATE) เวลาที่ระบบคำนวณผลผ่าน/ไม่ผ่าน
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = 'internship_evaluations';
    await queryInterface.addColumn(table, 'evaluation_items', {
      type: Sequelize.TEXT, // เก็บ JSON.stringify ของ array รายการคะแนน
      allowNull: true,
    });
    await queryInterface.addColumn(table, 'discipline_score', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn(table, 'behavior_score', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn(table, 'performance_score', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn(table, 'method_score', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn(table, 'relation_score', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn(table, 'supervisor_pass_decision', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
    });
    await queryInterface.addColumn(table, 'pass_fail', {
      type: Sequelize.STRING(10), // 'pass' หรือ 'fail'
      allowNull: true,
    });
    await queryInterface.addColumn(table, 'pass_evaluated_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },
  async down(queryInterface) {
    const table = 'internship_evaluations';
    await queryInterface.removeColumn(table, 'evaluation_items');
    await queryInterface.removeColumn(table, 'discipline_score');
    await queryInterface.removeColumn(table, 'behavior_score');
    await queryInterface.removeColumn(table, 'performance_score');
    await queryInterface.removeColumn(table, 'method_score');
    await queryInterface.removeColumn(table, 'relation_score');
    await queryInterface.removeColumn(table, 'supervisor_pass_decision');
    await queryInterface.removeColumn(table, 'pass_fail');
    await queryInterface.removeColumn(table, 'pass_evaluated_at');
  }
};
