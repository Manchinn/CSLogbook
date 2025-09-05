'use strict';
/**
 * เพิ่มฟิลด์รองรับระบบส่งช้า + ผูกกับ ImportantDeadline
 * - important_deadline_id (FK nullable)
 * - submitted_at (เวลาที่ถือว่าส่ง / first upload)
 * - is_late (boolean)
 * - late_minutes (int)
 * - late_reason (text) อนาคตสำหรับนักศึกษาชี้แจง
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = 'documents';
    const desc = await queryInterface.describeTable(table);
    if (!desc['important_deadline_id']) {
      await queryInterface.addColumn(table, 'important_deadline_id', { type: Sequelize.INTEGER, allowNull: true });
    }
    if (!desc['submitted_at']) {
      await queryInterface.addColumn(table, 'submitted_at', { type: Sequelize.DATE, allowNull: true });
    }
    if (!desc['is_late']) {
      await queryInterface.addColumn(table, 'is_late', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false });
    }
    if (!desc['late_minutes']) {
      await queryInterface.addColumn(table, 'late_minutes', { type: Sequelize.INTEGER, allowNull: true });
    }
    if (!desc['late_reason']) {
      await queryInterface.addColumn(table, 'late_reason', { type: Sequelize.TEXT, allowNull: true });
    }
    // index สำหรับค้นหา deadline stats
    await queryInterface.addIndex(table, ['important_deadline_id', 'is_late']);
  },
  async down(queryInterface) {
    const table = 'documents';
    await queryInterface.removeIndex(table, ['important_deadline_id', 'is_late']).catch(()=>{});
    await queryInterface.removeColumn(table, 'late_reason').catch(()=>{});
    await queryInterface.removeColumn(table, 'late_minutes').catch(()=>{});
    await queryInterface.removeColumn(table, 'is_late').catch(()=>{});
    await queryInterface.removeColumn(table, 'submitted_at').catch(()=>{});
    await queryInterface.removeColumn(table, 'important_deadline_id').catch(()=>{});
  }
};
