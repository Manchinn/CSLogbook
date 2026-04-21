'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Note: signatory_id already exists in documents table in this environment
    
    await queryInterface.addColumn('documents', 'signatory_name_snapshot', {
      type: Sequelize.STRING(150),
      allowNull: true,
      comment: 'ชื่อผู้ลงนาม ณ เวลาที่อนุมัติเอกสาร'
    });

    await queryInterface.addColumn('documents', 'signatory_title_snapshot', {
      type: Sequelize.STRING(150),
      allowNull: true,
      comment: 'ตำแหน่งผู้ลงนาม ณ เวลาที่อนุมัติเอกสาร'
    });

    await queryInterface.addColumn('documents', 'signatory_signature_snapshot', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'URL ลายเซ็น ณ เวลาที่อนุมัติเอกสาร'
    });

    // Check if index exists before adding it
    const [results] = await queryInterface.sequelize.query(
      "SHOW INDEX FROM documents WHERE Key_name = 'idx_documents_signatory_id'"
    );
    if (results.length === 0) {
      await queryInterface.addIndex('documents', ['signatory_id'], {
        name: 'idx_documents_signatory_id'
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('documents', 'idx_documents_signatory_id');
    await queryInterface.removeColumn('documents', 'signatory_name_snapshot');
    await queryInterface.removeColumn('documents', 'signatory_title_snapshot');
    await queryInterface.removeColumn('documents', 'signatory_signature_snapshot');
  }
};
