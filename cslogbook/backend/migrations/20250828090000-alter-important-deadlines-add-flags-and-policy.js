'use strict';

/**
 * เพิ่มคอลัมน์เสริมให้ตาราง important_deadlines สำหรับระบบแจ้งเตือน + policy การรับเอกสาร
 * - description (รายละเอียด)
 * - is_critical (ระบุว่าเป็นกำหนดส่งสำคัญ, ใช้ trigger critical notification)
 * - notified (เคยส่งแจ้งเตือนระยะปกติแล้ว)
 * - critical_notified (เคยส่งแจ้งเตือน critical แล้ว)
 * - accepting_submissions (เปิด/ปิดการรับเอกสาร)
 * - allow_late (อนุญาตให้ส่งช้าหรือไม่)
 * - lock_after_deadline (ปิดล็อกทันทีหลัง deadline แม้อนุญาตส่งช้าปกติ)
 * - grace_period_minutes (ช่วงผ่อนผันเพิ่มจาก deadline ก่อนถือว่าสาย)
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = 'important_deadlines';

    // หมายเหตุ: ไม่เช็ค exists รายคอลัมน์ (สมมติสภาพแวดล้อม clean); หากต้อง idempotent ต้อง query describe ก่อน
    await queryInterface.addColumn(table, 'description', { type: Sequelize.TEXT, allowNull: true });
    await queryInterface.addColumn(table, 'is_critical', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false });
    await queryInterface.addColumn(table, 'notified', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false });
    await queryInterface.addColumn(table, 'critical_notified', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false });
    await queryInterface.addColumn(table, 'accepting_submissions', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true });
    await queryInterface.addColumn(table, 'allow_late', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true });
    await queryInterface.addColumn(table, 'lock_after_deadline', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false });
    await queryInterface.addColumn(table, 'grace_period_minutes', { type: Sequelize.INTEGER, allowNull: true });

    // ดัชนีเพิ่มสำหรับ query ความถี่สูง (notification agent)
    await queryInterface.addIndex(table, ['date', 'is_critical']);
    await queryInterface.addIndex(table, ['notified', 'critical_notified']);
  },
  async down(queryInterface) {
    const table = 'important_deadlines';
    await queryInterface.removeIndex(table, ['date', 'is_critical']).catch(()=>{});
    await queryInterface.removeIndex(table, ['notified', 'critical_notified']).catch(()=>{});
    await queryInterface.removeColumn(table, 'description');
    await queryInterface.removeColumn(table, 'is_critical');
    await queryInterface.removeColumn(table, 'notified');
    await queryInterface.removeColumn(table, 'critical_notified');
    await queryInterface.removeColumn(table, 'accepting_submissions');
    await queryInterface.removeColumn(table, 'allow_late');
    await queryInterface.removeColumn(table, 'lock_after_deadline');
    await queryInterface.removeColumn(table, 'grace_period_minutes');
  }
};
