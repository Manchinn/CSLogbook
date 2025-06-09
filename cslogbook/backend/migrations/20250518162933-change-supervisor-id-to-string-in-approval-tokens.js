'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.changeColumn('approval_tokens', 'supervisor_id', {
      type: Sequelize.STRING(255),
      allowNull: true
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.changeColumn('approval_tokens', 'supervisor_id', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
  }
};
