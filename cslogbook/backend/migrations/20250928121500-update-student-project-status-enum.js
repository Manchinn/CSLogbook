'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // ปรับค่า project_status ให้สอดคล้องกับ enum ใหม่ก่อนเปลี่ยน schema
    await queryInterface.sequelize.query(`
      UPDATE students
      SET project_status = 'not_started'
      WHERE project_status IS NULL OR project_status = ''
    `);

    await queryInterface.changeColumn('students', 'project_status', {
      type: Sequelize.ENUM('not_started', 'in_progress', 'completed', 'failed'),
      allowNull: false,
      defaultValue: 'not_started'
    });
  },

  async down(queryInterface, Sequelize) {
    // แปลงค่าที่ enum เก่ารองรับไม่ได้กลับก่อนย้อน schema
    await queryInterface.sequelize.query(`
      UPDATE students
      SET project_status = 'in_progress'
      WHERE project_status = 'failed'
    `);

    await queryInterface.changeColumn('students', 'project_status', {
      type: Sequelize.ENUM('not_started', 'in_progress', 'completed'),
      allowNull: false,
      defaultValue: 'not_started'
    });
  }
};
