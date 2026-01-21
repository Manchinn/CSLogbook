'use strict';
const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const passwordHash = await bcrypt.hash('password123', 10);

    // ลบข้อมูลเก่าก่อน (Cleanup)
    try {
      await queryInterface.sequelize.query(`
        DELETE FROM teachers WHERE user_id IN (SELECT user_id FROM users WHERE username IN ('teacher_dev', 'staff_dev'));
      `);
      await queryInterface.sequelize.query(`
        DELETE FROM users WHERE username IN ('teacher_dev', 'staff_dev');
      `);
    } catch (e) {
      console.log('Error cleaning up:', e);
    }

    // 1. สร้าง User: อาจารย์ (Academic)
    const teacherUser = await queryInterface.bulkInsert('users', [{
      username: 'teacher_dev',
      password: passwordHash,
      email: 'teacher_dev@kmutnb.ac.th',
      first_name: 'อาจารย์',
      last_name: 'ใจดี',
      role: 'teacher',
      active_status: true,
      created_at: new Date(),
      updated_at: new Date()
    }], { returning: true });

    // หา userId ของ teacher
    const teacherUserRecord = await queryInterface.sequelize.query(
      `SELECT user_id FROM users WHERE username = 'teacher_dev';`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const teacherUserId = teacherUserRecord[0].user_id;

    // ใส่ข้อมูลลงตาราง teachers
    await queryInterface.bulkInsert('teachers', [{
      user_id: teacherUserId,
      teacher_code: 'DEV_T001',
      position: 'Lecturer',
      teacher_type: 'academic', // อาจารย์ภาค
      can_access_topic_exam: true,
      can_export_project1: false,
      created_at: new Date(),
      updated_at: new Date()
    }]);

    // 2. สร้าง User: เจ้าหน้าที่ (Support)
    const staffUser = await queryInterface.bulkInsert('users', [{
      username: 'staff_dev',
      password: passwordHash,
      email: 'staff_dev@kmutnb.ac.th',
      first_name: 'เจ้าหน้าที่',
      last_name: 'ประสานงาน',
      role: 'teacher', // ในระบบใช้ role teacher แต่ type support
      active_status: true,
      created_at: new Date(),
      updated_at: new Date()
    }], { returning: true });

    const staffUserRecord = await queryInterface.sequelize.query(
        `SELECT user_id FROM users WHERE username = 'staff_dev';`,
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );
    const staffUserId = staffUserRecord[0].user_id;

    await queryInterface.bulkInsert('teachers', [{
      user_id: staffUserId,
      teacher_code: 'DEV_S001',
      position: 'Support Staff',
      teacher_type: 'support', // เจ้าหน้าที่
      can_access_topic_exam: true,
      can_export_project1: true,
      created_at: new Date(),
      updated_at: new Date()
    }]);
  },

  async down (queryInterface, Sequelize) {
    // ลบข้อมูลที่สร้าง
    await queryInterface.bulkDelete('users', {
        username: ['teacher_dev', 'staff_dev']
    });
    // ตาราง teachers จะลบ cascade หรือต้องลบเองแล้วแต่ setting แต่ user สำคัญสุด
  }
};
