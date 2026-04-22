'use strict';

/**
 * Backfill signatory columns that previous migrations assumed already existed.
 *
 * - 20260421090001 only added snapshot columns to `documents` (comment claimed
 *   `signatory_id` already existed in the environment).
 * - 20260421155000 added columns to `internship_certificate_requests` but was
 *   not idempotent; if it ever partially applied, re-runs were blocked.
 *
 * This migration idempotently ensures every signatory column + FK index exists
 * on both tables, so Document / InternshipCertificateRequest models can SELECT
 * without "Unknown column" errors.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await ensureColumn(queryInterface, 'documents', 'signatory_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'signatories', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'รหัสผู้ลงนาม'
    });
    await ensureColumn(queryInterface, 'documents', 'signatory_name_snapshot', {
      type: Sequelize.STRING(150),
      allowNull: true,
      comment: 'ชื่อผู้ลงนาม ณ เวลาที่อนุมัติเอกสาร'
    });
    await ensureColumn(queryInterface, 'documents', 'signatory_title_snapshot', {
      type: Sequelize.STRING(150),
      allowNull: true,
      comment: 'ตำแหน่งผู้ลงนาม ณ เวลาที่อนุมัติเอกสาร'
    });
    await ensureColumn(queryInterface, 'documents', 'signatory_signature_snapshot', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'URL ลายเซ็น ณ เวลาที่อนุมัติเอกสาร'
    });
    await ensureIndex(queryInterface, 'documents', ['signatory_id'], 'idx_documents_signatory_id');

    await ensureColumn(queryInterface, 'internship_certificate_requests', 'signatory_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'signatories', key: 'id' },
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

  async down(queryInterface) {
    // No-op: safer to leave backfilled columns in place on rollback than to
    // drop data that parallel code paths may now rely on.
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

async function indexExists(queryInterface, table, name) {
  const [rows] = await queryInterface.sequelize.query(
    `SHOW INDEX FROM \`${table}\` WHERE Key_name = :name`,
    { replacements: { name } }
  );
  return rows.length > 0;
}

async function ensureIndex(queryInterface, table, fields, name) {
  if (!(await indexExists(queryInterface, table, name))) {
    await queryInterface.addIndex(table, fields, { name });
  }
}
