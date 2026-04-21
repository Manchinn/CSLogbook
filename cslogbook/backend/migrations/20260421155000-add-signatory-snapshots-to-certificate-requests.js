'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('internship_certificate_requests', 'signatory_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'signatories',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'รหัสผู้ลงนาม'
    });

    await queryInterface.addColumn('internship_certificate_requests', 'signatory_name_snapshot', {
      type: Sequelize.STRING(150),
      allowNull: true,
      comment: 'ชื่อผู้ลงนาม ณ เวลาที่อนุมัติ'
    });

    await queryInterface.addColumn('internship_certificate_requests', 'signatory_title_snapshot', {
      type: Sequelize.STRING(150),
      allowNull: true,
      comment: 'ตำแหน่งผู้ลงนาม ณ เวลาที่อนุมัติ'
    });

    await queryInterface.addColumn('internship_certificate_requests', 'signatory_signature_snapshot', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'URL ลายเซ็น ณ เวลาที่อนุมัติ'
    });

    // Add index
    await queryInterface.addIndex('internship_certificate_requests', ['signatory_id'], {
      name: 'idx_cert_requests_signatory_id'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('internship_certificate_requests', 'idx_cert_requests_signatory_id');
    await queryInterface.removeColumn('internship_certificate_requests', 'signatory_id');
    await queryInterface.removeColumn('internship_certificate_requests', 'signatory_name_snapshot');
    await queryInterface.removeColumn('internship_certificate_requests', 'signatory_title_snapshot');
    await queryInterface.removeColumn('internship_certificate_requests', 'signatory_signature_snapshot');
  }
};
