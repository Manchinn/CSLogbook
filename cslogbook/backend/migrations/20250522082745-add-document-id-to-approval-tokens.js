'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('approval_tokens', 'document_id', {
      type: Sequelize.INTEGER,
      allowNull: true, // Or false if it's a required field
      references: {
        model: 'documents', // Name of the table being referenced
        key: 'document_id',   // Name of the column in the documents table
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL', // Or 'CASCADE' or 'RESTRICT' depending on your requirements
    });
    // Also, ensure the ENUM type for 'type' column is updated if you haven't done so via a migration
    // This might require a more complex migration for some databases like PostgreSQL
    // For MySQL, you might need to ALTER TABLE MODIFY COLUMN
    await queryInterface.changeColumn('approval_tokens', 'type', {
      type: Sequelize.ENUM('single', 'weekly', 'monthly', 'full', 'supervisor_evaluation'),
      defaultValue: 'single',
      allowNull: false
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('approval_tokens', 'document_id');
    // Revert ENUM (be careful with data loss or issues if values exist)
    await queryInterface.changeColumn('approval_tokens', 'type', {
      type: Sequelize.ENUM('single', 'weekly', 'monthly', 'full'),
      defaultValue: 'single',
      allowNull: false
    });
  }
};