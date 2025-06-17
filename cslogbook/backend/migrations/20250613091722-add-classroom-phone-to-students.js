'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn('students', 'classroom', {
      type: Sequelize.STRING(10),
      allowNull: true,
      comment: 'ห้องเรียน (RA, RB, RC, DA, DB, CSB)'
    });
    
    await queryInterface.addColumn('students', 'phone_number', {
      type: Sequelize.STRING(15),
      allowNull: true,
      comment: 'เบอร์โทรศัพท์นักศึกษา'
    });
    
    // สร้าง index สำหรับ classroom เพื่อประสิทธิภาพในการค้นหา
    await queryInterface.addIndex('students', ['classroom'], {
      name: 'idx_student_classroom'
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeIndex('students', 'idx_student_classroom');
    await queryInterface.removeColumn('students', 'classroom');
    await queryInterface.removeColumn('students', 'phone_number');
  }
};
