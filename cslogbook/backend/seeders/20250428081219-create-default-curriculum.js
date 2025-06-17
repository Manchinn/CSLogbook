'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // เพิ่มข้อมูลหลักสูตรเริ่มต้น
    const curriculums = [
      {
        code: 'CS2563',
        name: 'หลักสูตรวิทยาศาสตรบัณฑิต สาขาวิชาวิทยาการคอมพิวเตอร์ (หลักสูตรปรับปรุง พ.ศ. 2563)',
        short_name: 'CS 63',
        start_year: 2563,
        end_year: null,
        active: true,
        total_credits: 130,
        major_credits: 90,
        max_credits: 142,
        internship_base_credits: 81,
        project_base_credits: 95,
        project_major_base_credits: 47,
        requirements: JSON.stringify({
          require_internship_before_project: false
        }),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        code: 'CS2568',
        name: 'หลักสูตรวิทยาศาสตรบัณฑิต สาขาวิชาวิทยาการคอมพิวเตอร์ (หลักสูตรปรับปรุง พ.ศ. 2568)',
        short_name: 'CS 68',
        start_year: 2568,
        end_year: null,
        active: true,
        total_credits: 135,
        major_credits: 95,
        max_credits: 145,
        internship_base_credits: 85,
        project_base_credits: 100,
        project_major_base_credits: 50,
        requirements: JSON.stringify({
          require_internship_before_project: true
        }),
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    // ใส่ข้อมูลหลักสูตรและเก็บ ID ที่สร้างขึ้น
    let createdCurriculums;
    try {
      createdCurriculums = await queryInterface.bulkInsert('curriculums', curriculums, { returning: true });
      console.log('Created curriculums:', createdCurriculums);
    } catch (error) {
      console.error('Error inserting curriculums:', error);
      // ถ้าเกิด error ให้ตรวจสอบว่าอาจมีข้อมูลอยู่แล้ว
      createdCurriculums = await queryInterface.sequelize.query(
        `SELECT curriculum_id FROM curriculums WHERE short_name = 'CS 63'`,
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );
    }

    // ตรวจสอบว่ามีข้อมูล academics หรือไม่
    const academics = await queryInterface.sequelize.query(
      'SELECT * FROM academics LIMIT 1',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // กรณีมี academics อยู่แล้ว ให้อัปเดต active_curriculum_id
    if (academics.length > 0) {
      // ดึง curriculum_id ของหลักสูตร CS 63
      let curriculumId = null;

      if (Array.isArray(createdCurriculums) && createdCurriculums.length > 0) {
        // กรณีที่ได้ ID กลับมาจาก bulkInsert
        curriculumId = createdCurriculums[0].curriculum_id || createdCurriculums[0].id;
      } else {
        // กรณีที่ต้องดึงจากฐานข้อมูล
        const curriculum = await queryInterface.sequelize.query(
          `SELECT curriculum_id FROM curriculums WHERE short_name = 'CS 63' LIMIT 1`,
          { type: queryInterface.sequelize.QueryTypes.SELECT }
        );
        if (curriculum.length > 0) {
          curriculumId = curriculum[0].curriculum_id;
        }
      }

      if (curriculumId) {
        await queryInterface.sequelize.query(
          `UPDATE academics SET active_curriculum_id = ${curriculumId}, updated_at = NOW()`,
          { type: queryInterface.sequelize.QueryTypes.UPDATE }
        );
      }
    }
    // กรณีไม่มี academics ให้สร้างใหม่
    else {
      // ดึง curriculum_id ของหลักสูตร CS 63
      let curriculumId = null;

      if (Array.isArray(createdCurriculums) && createdCurriculums.length > 0) {
        // กรณีที่ได้ ID กลับมาจาก bulkInsert
        curriculumId = createdCurriculums[0].curriculum_id || createdCurriculums[0].id;
      } else {
        // กรณีที่ต้องดึงจากฐานข้อมูล
        const curriculum = await queryInterface.sequelize.query(
          `SELECT curriculum_id FROM curriculums WHERE short_name = 'CS 63' LIMIT 1`,
          { type: queryInterface.sequelize.QueryTypes.SELECT }
        );
        if (curriculum.length > 0) {
          curriculumId = curriculum[0].curriculum_id;
        }
      }

      if (curriculumId) {
        await queryInterface.bulkInsert('academics', [{
          current_semester: 1,
          academic_year: 2567,
          internship_semesters: JSON.stringify([3]),
          project_semesters: JSON.stringify([1, 2]),
          active_curriculum_id: curriculumId,
          active: true,
          created_at: new Date(),
          updated_at: new Date()
        }]);
      }
    }
  },

  async down(queryInterface, Sequelize) {
    // ลบข้อมูลหลักสูตรเริ่มต้น
    await queryInterface.bulkDelete('curriculums', {
      short_name: {
        [Sequelize.Op.in]: ['CS 63', 'CS 68']
      }
    }, {});
  }
};
