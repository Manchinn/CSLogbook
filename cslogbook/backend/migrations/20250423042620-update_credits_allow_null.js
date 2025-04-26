'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.changeColumn('curriculums', 'total_credits', {
      type: Sequelize.INTEGER,
      allowNull: true, // อนุญาตให้เป็น null
    });
    await queryInterface.changeColumn('curriculums', 'major_credits', {
      type: Sequelize.INTEGER,
      allowNull: true, // อนุญาตให้เป็น null
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.changeColumn('curriculums', 'total_credits', {
      type: Sequelize.INTEGER,
      allowNull: false, // กลับไปเป็นไม่อนุญาตให้ null
    });
    await queryInterface.changeColumn('curriculums', 'major_credits', {
      type: Sequelize.INTEGER,
      allowNull: false, // กลับไปเป็นไม่อนุญาตให้ null
    });
  }
};
