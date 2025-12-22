'use strict';

const { Op, QueryTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

const THAI_TZ = 'Asia/Bangkok';

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    const TOTAL_STUDENTS = 100;
    const BASE_STUDENT_CODE = BigInt('6304062630000');
    const CURRICULUM_ID = 42;
    const CREATED_AT = dayjs.tz('2023-01-05 08:00:00', THAI_TZ).toDate();
    const UPDATED_AT = dayjs.tz('2023-01-05 08:00:00', THAI_TZ).toDate();

    try {
      const studentsSeedData = Array.from({ length: TOTAL_STUDENTS }, (_, index) => {
        const studentCode = (BASE_STUDENT_CODE + BigInt(index)).toString();
        const classroomGroup = Math.floor(index / 25) + 1;
        return {
          index,
          studentCode,
          username: studentCode,
          email: `${studentCode}@kmutnb.ac.th`,
          firstName: 'นักศึกษา',
          lastName: `รุ่น63-${String(index + 1).padStart(3, '0')}`,
          classroom: `CS63-${classroomGroup}`
        };
      });

      const allUsernames = studentsSeedData.map((student) => student.username);

      // ตรวจสอบ username ที่มีอยู่แล้วเพื่อหลีกเลี่ยงการสร้างซ้ำ
      let existingUsers = [];
      if (allUsernames.length > 0) {
        const placeholders = allUsernames.map(() => '?').join(',');
        existingUsers = await queryInterface.sequelize.query(
          `SELECT username FROM users WHERE username IN (${placeholders})`,
          {
            replacements: allUsernames,
            type: QueryTypes.SELECT,
            transaction
          }
        );
      }

      const existingUsernameSet = new Set(existingUsers.map((user) => user.username));
      const studentsToCreate = studentsSeedData.filter((student) => !existingUsernameSet.has(student.username));

      if (studentsToCreate.length === 0) {
        console.log('No new students to create. All usernames already exist.');
        await transaction.rollback();
        return;
      }

      const hashedPassword = await bcrypt.hash('password123', 10);

      const usersToInsert = studentsToCreate.map((student) => ({
        username: student.username,
        password: hashedPassword,
        email: student.email,
        role: 'student',
        first_name: student.firstName,
        last_name: student.lastName,
        active_status: true,
        created_at: CREATED_AT,
        updated_at: UPDATED_AT
      }));

      await queryInterface.bulkInsert('users', usersToInsert, { transaction });

      const usernamesInserted = studentsToCreate.map((student) => student.username);
      const placeholders = usernamesInserted.map(() => '?').join(',');
      const insertedUsers = await queryInterface.sequelize.query(
        `SELECT user_id, username FROM users WHERE username IN (${placeholders})`,
        {
          replacements: usernamesInserted,
          type: QueryTypes.SELECT,
          transaction
        }
      );

      const userIdByUsername = insertedUsers.reduce((acc, row) => {
        acc[row.username] = row.user_id;
        return acc;
      }, {});

      const studentsToInsert = studentsToCreate.map((student) => {
        const userId = userIdByUsername[student.username];
        if (!userId) {
          throw new Error(`ไม่พบ user_id สำหรับ username ${student.username}`);
        }

        return {
          user_id: userId,
          curriculum_id: CURRICULUM_ID,
          student_code: student.studentCode,
          classroom: student.classroom,
          phone_number: null,
          total_credits: 0,
          major_credits: 0,
          gpa: null,
          study_type: 'regular',
          is_eligible_internship: false,
          is_eligible_project: false,
          internship_status: 'not_started',
          project_status: 'not_started',
          is_enrolled_internship: false,
          is_enrolled_project: false,
          created_at: CREATED_AT,
          updated_at: UPDATED_AT,
        };
      });

      await queryInterface.bulkInsert('students', studentsToInsert, { transaction });

      await transaction.commit();
      console.log(`Seeded ${studentsToInsert.length} historical students for academic year 2566 semester 1.`);
    } catch (error) {
      await transaction.rollback();
      console.error('Failed to seed historical students:', error);
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    const TOTAL_STUDENTS = 100;
    const BASE_STUDENT_CODE = BigInt('6304062630000');

    const studentCodes = Array.from({ length: TOTAL_STUDENTS }, (_, index) =>
      (BASE_STUDENT_CODE + BigInt(index)).toString()
    );

    try {
      await queryInterface.bulkDelete(
        'students',
        {
          student_code: {
            [Op.in]: studentCodes
          }
        },
        { transaction }
      );

      await queryInterface.bulkDelete(
        'users',
        {
          username: {
            [Op.in]: studentCodes
          }
        },
        { transaction }
      );

      await transaction.commit();
      console.log(`Reverted historical students for academic year 2566 semester 1.`);
    } catch (error) {
      await transaction.rollback();
      console.error('Failed to revert historical students seed:', error);
      throw error;
    }
  }
};

