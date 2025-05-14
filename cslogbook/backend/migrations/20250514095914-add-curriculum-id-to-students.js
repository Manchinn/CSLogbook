'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('students', 'curriculum_id', { // 'students' คือชื่อตารางของคุณ
      type: Sequelize.INTEGER,
      allowNull: true, // หรือ false ถ้าบังคับให้มี
      references: {
        model: 'curriculums', // ชื่อตาราง curriculums
        key: 'curriculum_id',   // หรือ primary key ของตาราง curriculums
      },
      onUpdate: 'CASCADE', // Optional: กำหนด behavior ของ foreign key
      onDelete: 'SET NULL', // Optional: หรือ 'RESTRICT', 'CASCADE' ตามความเหมาะสม
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('students', 'curriculum_id');
  }
};
