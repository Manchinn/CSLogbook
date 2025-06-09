// In the newly generated migration file (e.g., XXXXXXXXXXXXXX-add-email-to-approval-tokens.js)
'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('approval_tokens', 'email', {
      type: Sequelize.STRING,
      allowNull: true, // Set to false if an email should always be present for a token
      validate: {
        isEmail: true, // Optional: add validation at the database level if your DB supports it, though Sequelize handles this at app level
      },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('approval_tokens', 'email');
  }
};