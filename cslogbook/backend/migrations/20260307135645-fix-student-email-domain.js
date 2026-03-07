'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // แก้ email นักศึกษาที่ผิด: @kmutnb.ac.th → @email.kmutnb.ac.th
    // เฉพาะ student ที่ยังไม่มี @email.kmutnb.ac.th
    await queryInterface.sequelize.query(`
      UPDATE users
      SET email = REPLACE(email, '@kmutnb.ac.th', '@email.kmutnb.ac.th')
      WHERE role = 'student'
        AND email LIKE '%@kmutnb.ac.th'
        AND email NOT LIKE '%@email.kmutnb.ac.th'
    `);
  },

  async down(queryInterface, Sequelize) {
    // Revert: @email.kmutnb.ac.th → @kmutnb.ac.th
    await queryInterface.sequelize.query(`
      UPDATE users
      SET email = REPLACE(email, '@email.kmutnb.ac.th', '@kmutnb.ac.th')
      WHERE role = 'student'
        AND email LIKE '%@email.kmutnb.ac.th'
    `);
  }
};
