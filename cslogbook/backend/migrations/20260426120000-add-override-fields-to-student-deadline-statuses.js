'use strict';

/**
 * Phase 1 ของ Production-Grade Deadline Override
 *
 * เพิ่มคอลัมน์สำหรับ per-student deadline override ลงในตาราง student_deadline_statuses
 * ที่สร้างไว้ตั้งแต่ migration 20250829100000 แต่ยังไม่ถูกใช้งาน
 *
 * Override semantic:
 * - extended_until : ถ้ามีค่า + ยังไม่ revoke → ถือเป็น effective deadline ใหม่
 * - bypass_lock    : ถ้า true + ยังไม่ revoke → ข้าม lockAfterDeadline (ยังคงคำนวณ late แต่ไม่ block)
 * - granted_at / granted_by / reason : metadata การอนุมัติ
 * - revoked_at    : ถ้ามีค่า → override ถูกยกเลิก ไม่ apply อีก
 *
 * Idempotent: guard ทุก addColumn / addIndex เพื่อให้รัน migration ซ้ำใน prod ได้ปลอดภัย
 * (ตามนโยบาย project_idempotent_migrations)
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = 'student_deadline_statuses';

    const tables = await queryInterface.showAllTables();
    if (!tables.includes(table)) {
      // ถ้าตารางพื้นฐานยังไม่มี ให้ skip — migration 20250829100000 จะสร้างให้เอง
      return;
    }

    const desc = await queryInterface.describeTable(table);

    const addCol = async (name, spec) => {
      if (!desc[name]) {
        await queryInterface.addColumn(table, name, spec);
      }
    };

    await addCol('extended_until', { type: Sequelize.DATE, allowNull: true });
    await addCol('bypass_lock', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false });
    await addCol('granted_by', { type: Sequelize.INTEGER, allowNull: true });
    await addCol('granted_at', { type: Sequelize.DATE, allowNull: true });
    await addCol('revoked_at', { type: Sequelize.DATE, allowNull: true });
    await addCol('reason', { type: Sequelize.TEXT, allowNull: true });

    // index เพื่อ resolve override เร็ว: (student, deadline, revoked_at IS NULL)
    const indexName = 'idx_sds_active_override';
    let indexes = [];
    try {
      indexes = await queryInterface.showIndex(table);
    } catch (_) {
      indexes = [];
    }
    const exists = Array.isArray(indexes)
      && indexes.some((i) => i && (i.name === indexName || i.indexName === indexName));
    if (!exists) {
      await queryInterface.addIndex(table, ['student_id', 'important_deadline_id', 'revoked_at'], {
        name: indexName
      });
    }
  },

  async down(queryInterface) {
    const table = 'student_deadline_statuses';
    await queryInterface.removeIndex(table, 'idx_sds_active_override').catch(() => {});
    const cols = ['reason', 'revoked_at', 'granted_at', 'granted_by', 'bypass_lock', 'extended_until'];
    for (const col of cols) {
      await queryInterface.removeColumn(table, col).catch(() => {});
    }
  }
};
