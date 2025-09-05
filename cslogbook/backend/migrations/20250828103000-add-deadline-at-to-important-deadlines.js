'use strict';
/**
 * เพิ่ม deadline_at (UTC) + timezone ให้ important_deadlines และ backfill จาก date (23:59:59 Asia/Bangkok)
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = 'important_deadlines';
    const desc = await queryInterface.describeTable(table);
    if (!desc['deadline_at']) {
      await queryInterface.addColumn(table, 'deadline_at', { type: Sequelize.DATE, allowNull: true });
    }
    if (!desc['timezone']) {
      await queryInterface.addColumn(table, 'timezone', { type: Sequelize.STRING(64), allowNull: false, defaultValue: 'Asia/Bangkok' });
    }
    // backfill: พยายามใช้ CONVERT_TZ; ถ้า timezone table ไม่มีจะ fallback เป็นเวลา +07:00 (แปลงคร่าว ๆ)
    // Backfill (JS loop) เพื่อหลีกเลี่ยง strict mode error กับค่า '0000-00-00'
    const [rows] = await queryInterface.sequelize.query(`SELECT id, date FROM ${table} WHERE deadline_at IS NULL AND date IS NOT NULL`);
    const pad = (n) => n.toString().padStart(2,'0');
    for (const r of rows) {
      if (!r.date || r.date === '0000-00-00') continue; // skip invalid zero date
      // สร้างเวลา 23:59:59 ที่โซน Asia/Bangkok (+07:00) แล้วเก็บใน UTC
      // ใช้วิธีการสร้างเป็น ISO string แล้วแปลงเป็น UTC timestamp
      const localStr = `${r.date}T23:59:59+07:00`;
      const d = new Date(localStr);
      if (isNaN(d.getTime())) continue; // ข้ามถ้าพาร์สไม่ได้
      const yyyy = d.getUTCFullYear();
      const MM = pad(d.getUTCMonth() + 1);
      const dd = pad(d.getUTCDate());
      const HH = pad(d.getUTCHours());
      const mm = pad(d.getUTCMinutes());
      const ss = pad(d.getUTCSeconds());
      const utcStr = `${yyyy}-${MM}-${dd} ${HH}:${mm}:${ss}`;
      await queryInterface.sequelize.query(`UPDATE ${table} SET deadline_at='${utcStr}' WHERE id=${r.id}`);
    }
    await queryInterface.addIndex(table, ['deadline_at']);
  },
  async down(queryInterface) {
    const table = 'important_deadlines';
    await queryInterface.removeIndex(table, ['deadline_at']).catch(()=>{});
    await queryInterface.removeColumn(table, 'deadline_at').catch(()=>{});
    await queryInterface.removeColumn(table, 'timezone').catch(()=>{});
  }
};
