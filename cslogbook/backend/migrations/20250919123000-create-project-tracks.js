'use strict';

/**
 * สร้างตาราง project_tracks เพื่อรองรับหลายหมวด (multi-track) ต่อโครงงาน
 * track_code ใช้ ENUM รหัสสั้นเพื่อลดขนาดเก็บ
 * Mapping (frontend label -> code):
 *  - Network & Cyber Security -> NETSEC
 *  - Mobile and Web Technology (Web / Mobile Application) -> WEBMOBILE
 *  - Smart Technology -> SMART
 *  - Artificial Intelligence -> AI
 *  - Games & Multimedia -> GAMEMEDIA
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('project_tracks', {
      project_track_id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      project_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'project_documents', key: 'project_id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      track_code: {
        type: Sequelize.ENUM('NETSEC','WEBMOBILE','SMART','AI','GAMEMEDIA'),
        allowNull: false
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') }
    });
    await queryInterface.addConstraint('project_tracks', {
      fields: ['project_id','track_code'],
      type: 'unique',
      name: 'uq_project_track_unique'
    });
    await queryInterface.addIndex('project_tracks', ['track_code'], { name: 'idx_project_tracks_code' });
  },
  async down(queryInterface) {
    // ต้องดรอป index + constraint + ตาราง + ENUM
    await queryInterface.removeIndex('project_tracks', 'idx_project_tracks_code').catch(()=>{});
    await queryInterface.removeConstraint('project_tracks', 'uq_project_track_unique').catch(()=>{});
    await queryInterface.dropTable('project_tracks');
    // ดรอป ENUM เฉพาะ Postgres ปกติ MySQL ใช้ ENUM inline (ถ้าเป็น MySQL ไม่ต้อง)
    // ถ้าใช้ PostgreSQL: await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_project_tracks_track_code\";");
  }
};
