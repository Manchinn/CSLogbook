'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    try {
      // 1. เพิ่มข้อมูลหลักสูตรเริ่มต้น
      const now = new Date();
      
      // ตรวจสอบว่ามีหลักสูตร CS2566 อยู่แล้วหรือไม่
      const existingCurriculum = await queryInterface.sequelize.query(
        `SELECT * FROM curriculums WHERE code = 'CS2566'`,
        { type: Sequelize.QueryTypes.SELECT }
      );
      
      let curriculumId;
      
      if (existingCurriculum.length === 0) {
        // ถ้ายังไม่มีหลักสูตร ให้สร้างใหม่
        try {
          const result = await queryInterface.bulkInsert('curriculums', [{
            code: 'CS2566',
            name: 'หลักสูตรวิทยาการคอมพิวเตอร์ (ปรับปรุงปี 2566)',
            short_name: 'CS 2566',
            start_year: 2566,
            end_year: null,
            active: true,
            total_credits: 130,
            major_credits: 90,
            max_credits: 150,
            internship_base_credits: 81,
            project_base_credits: 95,
            project_major_base_credits: 47,
            requirements: JSON.stringify({
              require_internship_before_project: false
            }),
            created_at: now,
            updated_at: now
          }], { returning: true });
          
          if (Array.isArray(result)) {
            curriculumId = result[0].curriculum_id;
          } else if (result) {
            // หาค่า curriculum_id จากตาราง
            const insertedCurriculum = await queryInterface.sequelize.query(
              `SELECT curriculum_id FROM curriculums WHERE code = 'CS2566' LIMIT 1`,
              { type: Sequelize.QueryTypes.SELECT }
            );
            if (insertedCurriculum.length > 0) {
              curriculumId = insertedCurriculum[0].curriculum_id;
            }
          }
        } catch (error) {
          console.error('Error inserting curriculum:', error.message);
          // หากมีข้อผิดพลาด ลองหาว่ามีหลักสูตรอยู่แล้วหรือไม่
          const curriculum = await queryInterface.sequelize.query(
            `SELECT curriculum_id FROM curriculums WHERE code = 'CS2566' OR short_name = 'CS 2566' LIMIT 1`,
            { type: Sequelize.QueryTypes.SELECT }
          );
          if (curriculum.length > 0) {
            curriculumId = curriculum[0].curriculum_id;
          }
        }
      } else {
        // ถ้ามีหลักสูตรอยู่แล้ว ดึงค่า curriculum_id
        curriculumId = existingCurriculum[0].curriculum_id;
      }

      // 2. ตรวจสอบว่ามี academic setting อยู่แล้วหรือไม่
      const academicSettings = await queryInterface.sequelize.query(
        `SELECT * FROM academics ORDER BY created_at DESC LIMIT 1;`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      // 3. ถ้ายังไม่มี academic setting และมี curriculumId ให้สร้างใหม่
      if ((!academicSettings || academicSettings.length === 0) && curriculumId) {
        try {
          // สร้าง academic setting ใหม่พร้อมตั้งค่า active_curriculum_id
          await queryInterface.bulkInsert('academics', [{
            academic_year: new Date().getFullYear() + 543, // ปีการศึกษาปัจจุบัน (พ.ศ.)
            current_semester: 2, // สมมติว่าเป็นภาคเรียนที่ 2
            active_curriculum_id: curriculumId,
            internship_semesters: JSON.stringify([3]), // ภาคฤดูร้อน
            project_semesters: JSON.stringify([1, 2]), // ภาคเรียนที่ 1 และ 2
            active: true,
            created_at: now,
            updated_at: now
          }]);
        } catch (error) {
          console.error('Error inserting academic setting:', error.message);
        }
      } else if (academicSettings.length > 0 && curriculumId) {
        try {
          // ถ้ามี academic setting อยู่แล้ว ให้อัพเดท active_curriculum_id
          await queryInterface.sequelize.query(
            `UPDATE academics SET active_curriculum_id = :curriculumId, updated_at = NOW() WHERE id = :id`,
            {
              replacements: { 
                curriculumId: curriculumId,
                id: academicSettings[0].id 
              },
              type: Sequelize.QueryTypes.UPDATE
            }
          );
        } catch (error) {
          console.error('Error updating academic setting:', error.message);
        }
      }
      
      console.log('Seeder completed successfully!');
    } catch (error) {
      console.error('Seeder error:', error);
    }
  },

  async down (queryInterface, Sequelize) {
    try {
      // 1. ลบ active_curriculum_id ออกจาก academics
      await queryInterface.sequelize.query(
        `UPDATE academics SET active_curriculum_id = NULL WHERE active_curriculum_id IS NOT NULL`
      );
      
      // 2. ลบข้อมูลหลักสูตรที่เพิ่มเข้าไป
      await queryInterface.bulkDelete('curriculums', { 
        code: 'CS2566' 
      });
    } catch (error) {
      console.error('Error in down migration:', error);
    }
  }
};
