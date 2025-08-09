'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. เพิ่มฟิลด์ teacher_type ในตาราง teachers
    await queryInterface.addColumn('teachers', 'teacher_type', {
      type: Sequelize.ENUM('academic', 'support'),
      allowNull: false,
      defaultValue: 'academic',
      after: 'contact_extension'
    });

    // 2. เพิ่ม index สำหรับ teacher_type
    await queryInterface.addIndex('teachers', ['teacher_type'], {
      name: 'idx_teachers_teacher_type'
    });

    // 3. อัปเดต role ในตาราง users (ถ้าต้องการ)
    // เปลี่ยนจาก 'teacher' เป็น 'teacher_academic' หรือ 'teacher_support'
    // await queryInterface.sequelize.query(`
    //   UPDATE users 
    //   SET role = 'teacher_academic' 
    //   WHERE role = 'teacher'
    // `);
  },

  down: async (queryInterface, Sequelize) => {
    // ลบ index
    await queryInterface.removeIndex('teachers', 'idx_teachers_teacher_type');
    
    // ลบคอลัมน์
    await queryInterface.removeColumn('teachers', 'teacher_type');
  }
}; 