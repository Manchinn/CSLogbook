'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await ensureColumn(queryInterface, 'internship_certificate_requests', 'signatory_id', {
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

    await ensureColumn(queryInterface, 'internship_certificate_requests', 'signatory_name_snapshot', {
      type: Sequelize.STRING(150),
      allowNull: true,
      comment: 'ชื่อผู้ลงนาม ณ เวลาที่อนุมัติ'
    });

    await ensureColumn(queryInterface, 'internship_certificate_requests', 'signatory_title_snapshot', {
      type: Sequelize.STRING(150),
      allowNull: true,
      comment: 'ตำแหน่งผู้ลงนาม ณ เวลาที่อนุมัติ'
    });

    await ensureColumn(queryInterface, 'internship_certificate_requests', 'signatory_signature_snapshot', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'URL ลายเซ็น ณ เวลาที่อนุมัติ'
    });

    await ensureIndex(
      queryInterface,
      'internship_certificate_requests',
      ['signatory_id'],
      'idx_cert_requests_signatory_id'
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('internship_certificate_requests', 'idx_cert_requests_signatory_id');
    await queryInterface.removeColumn('internship_certificate_requests', 'signatory_id');
    await queryInterface.removeColumn('internship_certificate_requests', 'signatory_name_snapshot');
    await queryInterface.removeColumn('internship_certificate_requests', 'signatory_title_snapshot');
    await queryInterface.removeColumn('internship_certificate_requests', 'signatory_signature_snapshot');
  }
};

async function columnExists(queryInterface, table, column) {
  const columns = await queryInterface.describeTable(table);
  return Object.prototype.hasOwnProperty.call(columns, column);
}

async function ensureColumn(queryInterface, table, column, definition) {
  if (!(await columnExists(queryInterface, table, column))) {
    await queryInterface.addColumn(table, column, definition);
  }
}

async function ensureIndex(queryInterface, table, fields, name) {
  const [rows] = await queryInterface.sequelize.query(
    `SHOW INDEX FROM \`${table}\` WHERE Key_name = :name`,
    { replacements: { name } }
  );
  if (rows.length === 0) {
    await queryInterface.addIndex(table, fields, { name });
  }
}
