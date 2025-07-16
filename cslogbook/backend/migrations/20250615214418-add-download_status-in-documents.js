'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // เพิ่ม field download_status ที่เฉพาะเจาะจงสำหรับการดาวน์โหลด
    await queryInterface.addColumn('documents', 'download_status', {
      type: Sequelize.ENUM('not_downloaded', 'downloaded'),
      allowNull: true,
      defaultValue: 'not_downloaded',
      comment: 'สถานะการดาวน์โหลดเอกสาร เช่น หนังสือส่งตัว หรือเอกสารอื่นๆ ที่สร้างแบบ real-time'
    });

    // เพิ่ม field เก็บวันที่ดาวน์โหลด
    await queryInterface.addColumn('documents', 'downloaded_at', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'วันที่และเวลาที่ดาวน์โหลดล่าสุด'
    });

    // เพิ่ม field เก็บจำนวนครั้งที่ดาวน์โหลด
    await queryInterface.addColumn('documents', 'download_count', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: 'จำนวนครั้งที่ได้มีการดาวน์โหลดเอกสาร'
    });

    // เพิ่ม index สำหรับ download_status เพื่อประสิทธิภาพ
    await queryInterface.addIndex('documents', ['download_status'], {
      name: 'idx_documents_download_status'
    });

    // เพิ่ม composite index สำหรับ query ที่ซับซ้อน
    await queryInterface.addIndex('documents', ['document_type', 'download_status'], {
      name: 'idx_documents_type_download_status'
    });

    // เพิ่ม index สำหรับ downloaded_at
    await queryInterface.addIndex('documents', ['downloaded_at'], {
      name: 'idx_documents_downloaded_at'
    });
  },

  async down(queryInterface, Sequelize) {
    // ลบ indexes ก่อน
    await queryInterface.removeIndex('documents', 'idx_documents_downloaded_at');
    await queryInterface.removeIndex('documents', 'idx_documents_type_download_status');
    await queryInterface.removeIndex('documents', 'idx_documents_download_status');

    // ลบ columns
    await queryInterface.removeColumn('documents', 'download_count');
    await queryInterface.removeColumn('documents', 'downloaded_at');
    await queryInterface.removeColumn('documents', 'download_status');

    // ลบ ENUM type (ถ้าไม่มีการใช้งานที่อื่น)
    await queryInterface.sequelize.query(
      "DROP TYPE IF EXISTS \"enum_documents_download_status\";"
    );
  }
};