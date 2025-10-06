'use strict';

const { Student, InternshipDocument, ApprovalToken } = require('../models');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Seeder สำหรับสร้างข้อมูล internship_evaluation สำหรับ studentId: 32 และ internship_id: 51
 * 
 * IMPORTANT:
 * 1. BACKUP YOUR DATABASE before running.
 * 2. ตรวจสอบว่า student_id: 32 และ internship_id: 51 มีอยู่จริง
 * 3. ตรวจสอบว่า approval_token_id ที่เกี่ยวข้องมีอยู่จริง
 */
module.exports = {
  async up(queryInterface, SequelizeInstance) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const studentId = 32;
      const internshipId = 51;

      // ตรวจสอบว่า student และ internship document มีอยู่จริง
      const student = await Student.findByPk(studentId, { transaction });
      if (!student) {
        console.log(`Student with ID ${studentId} not found. Skipping seeding.`);
        await transaction.commit();
        return;
      }

      const internshipDocument = await InternshipDocument.findByPk(internshipId, { transaction });
      if (!internshipDocument) {
        console.log(`Internship document with ID ${internshipId} not found. Skipping seeding.`);
        await transaction.commit();
        return;
      }

      console.log(`Found student: ${student.first_name || 'N/A'} ${student.last_name || 'N/A'} (ID: ${studentId})`);
      console.log(`Found internship document ID: ${internshipId}`);

      // ตรวจสอบว่า internship_evaluation สำหรับ student_id และ internship_id นี้มีอยู่แล้วหรือไม่
      const existingEvaluation = await queryInterface.sequelize.query(
        `SELECT * FROM internship_evaluations WHERE student_id = ? AND internship_id = ?`,
        {
          replacements: [studentId, internshipId],
          type: queryInterface.sequelize.QueryTypes.SELECT,
          transaction
        }
      );

      if (existingEvaluation.length > 0) {
        console.log(`Internship evaluation for student ${studentId} and internship ${internshipId} already exists. Skipping seeding.`);
        await transaction.commit();
        return;
      }

      // หา approval token ที่เกี่ยวข้อง (ถ้ามี)
      const approvalToken = await ApprovalToken.findOne({
        where: {
          student_id: studentId,
          type: 'supervisor_evaluation'
        },
        order: [['created_at', 'DESC']],
        transaction
      });

      // สร้างข้อมูล evaluation
      const evaluationData = {
        approval_token_id: approvalToken ? approvalToken.token_id : null,
        internship_id: internshipId,
        student_id: studentId,
        evaluator_name: 'อาจารย์ที่ปรึกษา', // หรือชื่ออาจารย์ที่ประเมินจริง
        evaluation_date: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        q1_knowledge: 4, // คะแนนความรู้ (1-5)
        q2_responsibility: 4, // คะแนนความรับผิดชอบ (1-5)
        q3_initiative: 3, // คะแนนความคิดริเริ่ม (1-5)
        q4_adaptability: 4, // คะแนนการปรับตัว (1-5)
        q5_problem_solving: 3, // คะแนนการแก้ปัญหา (1-5)
        q6_communication: 4, // คะแนนการสื่อสาร (1-5)
        q7_punctuality: 5, // คะแนนความตรงต่อเวลา (1-5)
        q8_personality: 4, // คะแนนบุคลิกภาพ (1-5)
        overall_score: 3.88, // คะแนนรวมเฉลี่ย
        strengths: 'มีความรับผิดชอบสูง ตรงต่อเวลา และมีความรู้พื้นฐานที่ดี',
        weaknesses_to_improve: 'ควรพัฒนาความคิดริเริ่มและการแก้ปัญหาที่ซับซ้อนให้มากขึ้น',
        additional_comments: 'นักศึกษามีความก้าวหน้าในการฝึกงานเป็นอย่างดี ควรส่งเสริมให้พัฒนาทักษะการคิดวิเคราะห์เพิ่มเติม',
        overall_grade: 'B+', // เกรดรวม
        status: 'submitted_by_supervisor', // สถานะการประเมิน
        evaluated_by_supervisor_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        created_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        updated_at: dayjs().format('YYYY-MM-DD HH:mm:ss')
      };

      // เพิ่มข้อมูลลงในตาราง
      await queryInterface.bulkInsert('internship_evaluations', [evaluationData], { transaction });

      console.log(`Successfully seeded internship evaluation for student ${studentId} and internship ${internshipId}`);
      console.log(`Evaluation data:`, {
        evaluator: evaluationData.evaluator_name,
        overallScore: evaluationData.overall_score,
        overallGrade: evaluationData.overall_grade,
        status: evaluationData.status
      });

      await transaction.commit();
      console.log('Seeder completed successfully.');

    } catch (error) {
      console.error('Error in seeder:', error);
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, SequelizeInstance) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const studentId = 32;
      const internshipId = 51;

      // ลบข้อมูล evaluation ที่สร้างขึ้น
      await queryInterface.bulkDelete('internship_evaluations', {
        student_id: studentId,
        internship_id: internshipId
      }, { transaction });

      console.log(`Removed internship evaluation for student ${studentId} and internship ${internshipId}`);
      await transaction.commit();

    } catch (error) {
      console.error('Error in rollback:', error);
      await transaction.rollback();
      throw error;
    }
  }
}; 