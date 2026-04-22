'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
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

    if (await columnExists(queryInterface, 'documents', 'signatory_id')) {
      await ensureIndex(queryInterface, 'documents', ['signatory_id'], 'idx_documents_signatory_id');
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('documents', 'idx_documents_signatory_id');
    await queryInterface.removeColumn('documents', 'signatory_name_snapshot');
    await queryInterface.removeColumn('documents', 'signatory_title_snapshot');
    await queryInterface.removeColumn('documents', 'signatory_signature_snapshot');
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
