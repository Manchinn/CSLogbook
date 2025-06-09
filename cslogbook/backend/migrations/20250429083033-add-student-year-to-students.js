'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // ตรวจสอบว่าคอลัมน์มีอยู่แล้วหรือไม่
    const tableInfo = await queryInterface.sequelize.query(
      "SHOW COLUMNS FROM `students` LIKE 'student_year';",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // ถ้าคอลัมน์ยังไม่มี ให้สร้างใหม่
    if (tableInfo.length === 0) {
      await queryInterface.addColumn('students', 'student_year', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 1,
        validate: {
          min: 1,
          max: 8 // ค่าสูงสุดตาม MAX_STUDY_YEARS ที่กำหนดไว้ในระบบ
        }
      });
    }

    // อัปเดตค่าในคอลัมน์ student_year ตามหลักการคำนวณใน calculateStudentYear
    await queryInterface.sequelize.query(`
      UPDATE students 
      SET student_year = CASE
        -- คำนวณปีที่เข้าศึกษาจากรหัสนักศึกษา (2 หลักแรก + 2500)
        WHEN (YEAR(CURDATE()) + 543 - (2500 + CAST(SUBSTRING(student_code, 1, 2) AS UNSIGNED))) > 8 THEN 8
        WHEN (YEAR(CURDATE()) + 543 - (2500 + CAST(SUBSTRING(student_code, 1, 2) AS UNSIGNED))) < 1 THEN 1
        -- ถ้าเดือนปัจจุบันมากกว่า 4 (ACADEMIC_MONTH_THRESHOLD) ให้บวกเพิ่มอีก 1 ปี
        WHEN MONTH(CURDATE()) > 4 THEN (YEAR(CURDATE()) + 543 - (2500 + CAST(SUBSTRING(student_code, 1, 2) AS UNSIGNED)) + 1)
        ELSE (YEAR(CURDATE()) + 543 - (2500 + CAST(SUBSTRING(student_code, 1, 2) AS UNSIGNED)))
      END
      WHERE student_code REGEXP '^[0-9]';
    `);
  },

  async down(queryInterface, Sequelize) {
    // ไม่ต้องทำอะไรในส่วน down เพราะเราไม่แน่ใจว่าคอลัมน์ถูกสร้างโดย migration นี้หรือไม่
    // แต่ถ้าต้องการให้สามารถ rollback ได้ ก็สามารถเพิ่มการตรวจสอบก่อนลบคอลัมน์ได้
    const tableInfo = await queryInterface.sequelize.query(
      "SHOW COLUMNS FROM `students` LIKE 'student_year';",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (tableInfo.length > 0) {
      // คอลัมน์มีอยู่ ดำเนินการลบได้
      await queryInterface.removeColumn('students', 'student_year');
    }
  }
};
