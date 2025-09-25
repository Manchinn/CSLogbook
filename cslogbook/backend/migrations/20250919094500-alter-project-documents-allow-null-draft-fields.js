'use strict';
/**
 * ปรับคอลัมน์ใน project_documents ให้อนุญาต NULL ช่วงสถานะ draft
 * เดิม (จากสคีมาเก่า) บังคับ NOT NULL ทำให้สร้าง draft ว่างไม่ได้
 * ฟิลด์ที่ผ่อนปรน: project_name_th, project_name_en, project_type, track, advisor_id, document_id
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = 'project_documents';

    const safeChange = async (col, definition) => {
      try { await queryInterface.changeColumn(table, col, definition); } catch(e) { /* ignore if missing */ }
    };

    await safeChange('project_name_th', { type: Sequelize.STRING(255), allowNull: true });
    await safeChange('project_name_en', { type: Sequelize.STRING(255), allowNull: true });
    await safeChange('project_type', { type: Sequelize.ENUM('govern','private','research'), allowNull: true });
    await safeChange('track', { type: Sequelize.STRING(100), allowNull: true });
    await safeChange('advisor_id', { type: Sequelize.INTEGER, allowNull: true, references: { model: 'teachers', key: 'teacher_id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' });
    await safeChange('document_id', { type: Sequelize.INTEGER, allowNull: true });
  },

  async down(queryInterface, Sequelize) {
    const table = 'project_documents';
    const revert = async (col, definition) => { try { await queryInterface.changeColumn(table, col, definition); } catch(e) { /* ignore */ } };

    await revert('project_name_th', { type: Sequelize.STRING(255), allowNull: false });
    await revert('project_name_en', { type: Sequelize.STRING(255), allowNull: false });
    await revert('project_type', { type: Sequelize.ENUM('govern','private','research'), allowNull: false });
    await revert('track', { type: Sequelize.STRING(100), allowNull: false });
    await revert('advisor_id', { type: Sequelize.INTEGER, allowNull: false });
    await revert('document_id', { type: Sequelize.INTEGER, allowNull: false });
  }
};
