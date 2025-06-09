'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // เพิ่มคอลัมน์ active_curriculum_id ในตาราง academics
    await queryInterface.addColumn('academics', 'active_curriculum_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'curriculums',
        key: 'curriculum_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  async down (queryInterface, Sequelize) {
    // ย้อนกลับการเพิ่มคอลัมน์
    await queryInterface.removeColumn('academics', 'active_curriculum_id');
  }
};
