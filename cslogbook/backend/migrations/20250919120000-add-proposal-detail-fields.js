'use strict';

/**
 * เพิ่มคอลัมน์รายละเอียดแบบฟอร์มเสนอหัวข้อ (คพ.01) ลงในตาราง project_documents
 * หมายเหตุ: ใช้ TEXT ทั้งหมดเพื่อความยืดหยุ่น ขนาดไม่ใหญ่มากนัก
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (t) => {
      const cols = [
        ['objective', { type: Sequelize.TEXT, allowNull: true }],
        ['background', { type: Sequelize.TEXT, allowNull: true }],
        ['scope', { type: Sequelize.TEXT, allowNull: true }],
        ['expected_outcome', { type: Sequelize.TEXT, allowNull: true }],
        ['benefit', { type: Sequelize.TEXT, allowNull: true }],
        ['methodology', { type: Sequelize.TEXT, allowNull: true }],
        ['tools', { type: Sequelize.TEXT, allowNull: true }],
        ['timeline_note', { type: Sequelize.TEXT, allowNull: true }],
        ['risk', { type: Sequelize.TEXT, allowNull: true }],
        ['constraints', { type: Sequelize.TEXT, allowNull: true }]
      ];
      for (const [name, def] of cols) {
        await queryInterface.addColumn('project_documents', name, def, { transaction: t });
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (t) => {
      const colNames = [
        'objective','background','scope','expected_outcome','benefit','methodology','tools','timeline_note','risk','constraints'
      ];
      for (const name of colNames) {
        // ใช้ try/catch กันกรณี column ไม่มี (ลดความเสี่ยง migration rollback fail)
        try { await queryInterface.removeColumn('project_documents', name, { transaction: t }); } catch(e) { /* ignore */ }
      }
    });
  }
};
