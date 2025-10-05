'use strict';

/**
 * เพิ่มฟิลด์ฐานหน่วยกิตของหลักสูตรให้รองรับการคำนวณฝึกงาน/โครงงาน
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('curriculums', 'internship_base_credits', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'หน่วยกิตขั้นต่ำที่ต้องผ่านก่อนออกฝึกงาน'
    });
    await queryInterface.addColumn('curriculums', 'project_base_credits', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'หน่วยกิตขั้นต่ำก่อนขึ้นโครงงานพิเศษ'
    });
    await queryInterface.addColumn('curriculums', 'project_major_base_credits', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'หน่วยกิตวิชาเอกขั้นต่ำสำหรับโครงงานพิเศษ'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('curriculums', 'internship_base_credits');
    await queryInterface.removeColumn('curriculums', 'project_base_credits');
    await queryInterface.removeColumn('curriculums', 'project_major_base_credits');
  }
};
