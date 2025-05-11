'use strict';

// Use InternshipLogbook model
const { Student, InternshipLogbook, TimelineStep, Company, Sequelize } = require('../models');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Seeder to simulate logbook completion for a specific student,
 * accounting for existing entries.
 *
 * IMPORTANT:
 * 1. BACKUP YOUR DATABASE before running.
 * 2. Use the correct student_id (32).
 * 3. Verify `loggingStepName` and `reportStepName`.
 * 4. Adjust `company_id` logic if required.
 */
module.exports = {
  async up(queryInterface, SequelizeInstance) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const studentIdToSeed = 32; // Use student_id directly
      const requiredHours = 240;
      const hoursPerDay = 8; // Max hours per seeded day
      const defaultStartDate = dayjs('2025-03-31'); // เปลี่ยนเป็นวันที่ 31 มีนาคม 2025 ตามที่ต้องการ

      // 1. Find the student - using findByPk since we're using the PK directly
      const student = await Student.findByPk(studentIdToSeed, { transaction });

      if (!student) {
        console.log(`Student with ID ${studentIdToSeed} not found. Skipping seeding.`);
        await transaction.commit();
        return;
      }
      console.log(`Found student with ID: ${student.id}`);

      // 2. Check existing logbook entries for this student
      const existingLogs = await InternshipLogbook.findAll({
        where: { student_id: studentIdToSeed },
        order: [['work_date', 'DESC']],
        transaction
      });

      let currentTotalHours = 0;
      let lastLogDate = null;

      if (existingLogs.length > 0) {
        existingLogs.forEach(log => {
          currentTotalHours += parseFloat(log.total_hours) || 0;
        });
        lastLogDate = dayjs(existingLogs[0].work_date); // work_date of the most recent entry
        console.log(`Student ID ${studentIdToSeed} has ${currentTotalHours} hours logged. Last log date: ${lastLogDate.format('YYYY-MM-DD')}`);
      } else {
        console.log(`No existing logbook entries found for student ID ${studentIdToSeed}.`);
      }

      // 3. Calculate remaining hours and determine new start date
      let remainingHoursNeeded = requiredHours - currentTotalHours;
      
      // ===== เริ่มการแก้ไข: บังคับใช้วันที่เริ่มต้น 31 มีนาคม 2025 =====
      // บังคับให้เริ่มจากวันที่ 31 มีนาคม 2025 โดยไม่สนใจวันที่บันทึกล่าสุดที่มีอยู่
      let nextLogStartDate = defaultStartDate;
      
      console.log(`Forcing start date to ${nextLogStartDate.format('YYYY-MM-DD')} regardless of existing logs.`);
      // ===== จบการแก้ไข =====

      if (remainingHoursNeeded <= 0) {
        console.log(`Student ID ${studentIdToSeed} has already met or exceeded the required ${requiredHours} hours.`);
        // Optionally, still ensure timeline steps are correct if hours are met
      } else {
        console.log(`Student ID ${studentIdToSeed} needs ${remainingHoursNeeded} more hours.`);
        const newLogEntries = [];
        let hoursSeededThisRun = 0;

        // Handle company_id for InternshipLogbook (OPTIONAL - adapt as needed)
        let companyId = null; // Set this if company_id is mandatory
        // If needed, get company_id from existing logs
        if (existingLogs.length > 0 && existingLogs[0].company_id) {
          companyId = existingLogs[0].company_id;
          console.log(`Using company_id ${companyId} from existing logs.`);
        }

        while (remainingHoursNeeded > 0) {
          // Skip weekends
          while (nextLogStartDate.day() === 0 || nextLogStartDate.day() === 6) { // Sunday (0) or Saturday (6)
            nextLogStartDate = nextLogStartDate.add(1, 'day');
          }

          const hoursForThisEntry = Math.min(remainingHoursNeeded, hoursPerDay);
          
          // Calculate time_out based on time_in + hours, using HH:MM format (5 chars)
          const timeIn = '09:00'; // Changed from '09:00:00' to match varchar(5)
          const timeOutHour = 9 + Math.floor(hoursForThisEntry);
          const timeOutMinute = hoursForThisEntry % 1 === 0 ? '00' : '30';
          const timeOut = `${timeOutHour < 10 ? '0' + timeOutHour : timeOutHour}:${timeOutMinute}`; // Formatted as HH:MM

          newLogEntries.push({
            student_id: studentIdToSeed, // Using the direct ID
            internship_id: 24, // Adding internship_id as required by the table
            company_id: companyId,
            work_date: nextLogStartDate.toDate(),
            time_in: timeIn,
            time_out: timeOut,
            total_hours: hoursForThisEntry,
            task_description: `งานฝึกงานวันที่ ${nextLogStartDate.format('YYYY-MM-DD')} (เพิ่มโดย seeder)`,
            status: 'approved',
            // Add any other required fields for InternshipLogbook model
          });

          remainingHoursNeeded -= hoursForThisEntry;
          hoursSeededThisRun += hoursForThisEntry;
          nextLogStartDate = nextLogStartDate.add(1, 'day');

          if (newLogEntries.length >= 120) { // Safety break (lower than previous 365)
            console.warn("Seeding loop ran for 120 entries. Breaking to prevent infinite loop.");
            break;
          }
        }

        // สร้างคำสั่ง SQL โดยตรงเพื่อเพิ่มข้อมูล logbook entries พร้อมกัน
        if (newLogEntries.length > 0) {
          const useDirectSQL = true; // Set this flag to toggle between direct SQL and bulkCreate
          if (useDirectSQL) {
            // ถ้าต้องการใช้ SQL โดยตรง (กรณีที่ bulkCreate มีปัญหา)
            let bulkInsertSQL = 'INSERT INTO `internship_logbooks` (`student_id`, `internship_id`, `work_date`, `log_title`, `work_description`, `learning_outcome`, `work_hours`, `problems`, `solutions`, `supervisor_approved`, `advisor_approved`, `time_in`, `time_out`, `created_at`, `updated_at`) VALUES ';
            
            const values = newLogEntries.map(entry => {
              const workDateStr = dayjs(entry.work_date).format('YYYY-MM-DD');
              const nowStr = dayjs().format('YYYY-MM-DD HH:mm:ss');
              const entryTitle = `บันทึกฝึกงานวันที่ ${workDateStr}`;
              const workDesc = `งานฝึกงานวันที่ ${workDateStr} (เพิ่มโดย seeder)`;
              const learningOutcome = `การเรียนรู้จากการฝึกงานวันที่ ${workDateStr}`;
              
              return `(${studentIdToSeed}, 24, '${workDateStr}', '${entryTitle}', '${workDesc}', '${learningOutcome}', ${entry.total_hours}, 'ไม่มีปัญหา', 'ไม่มี', false, false, '${entry.time_in}', '${entry.time_out}', '${nowStr}', '${nowStr}')`;
            });
            
            bulkInsertSQL += values.join(', ');
            await queryInterface.sequelize.query(bulkInsertSQL, { transaction });
            console.log(`Created ${newLogEntries.length} new internship logbook entries using direct SQL for student ID ${studentIdToSeed}.`);
          } else {
            // ใช้ bulkCreate โดยปรับให้ตรงกับชื่อฟิลด์ที่ถูกต้อง
            const preparedEntries = newLogEntries.map(entry => {
              const workDateStr = dayjs(entry.work_date).format('YYYY-MM-DD');
              const entryTitle = `บันทึกฝึกงานวันที่ ${workDateStr}`;
              const workDesc = `งานฝึกงานวันที่ ${workDateStr} (เพิ่มโดย seeder)`;
              const learningOutcome = `การเรียนรู้จากการฝึกงานวันที่ ${workDateStr}`;
              
              return {
                student_id: entry.student_id,
                internship_id: entry.internship_id,
                work_date: entry.work_date,
                log_title: entryTitle,
                work_description: workDesc,
                learning_outcome: learningOutcome,
                work_hours: entry.total_hours,
                problems: 'ไม่มีปัญหา',
                solutions: 'ไม่มี',
                supervisor_approved: false,
                advisor_approved: false,
                time_in: entry.time_in,
                time_out: entry.time_out
              };
            });
            
            await InternshipLogbook.bulkCreate(preparedEntries, { transaction });
            console.log(`Created ${newLogEntries.length} new internship logbook entries for student ID ${studentIdToSeed}, totaling ${hoursSeededThisRun} hours.`);
          }
          currentTotalHours += hoursSeededThisRun;
        }
      }

      // 4. Update timeline steps if required hours are met
      if (currentTotalHours >= requiredHours) {
        console.log(`Total hours for student ID ${studentIdToSeed} (${currentTotalHours}) meet/exceed ${requiredHours}. Updating timeline.`);
        
        // Find TimelineStep for the logging step - search by both student_id and type/name
        const loggingStepName = 'เริ่มฝึกงานและบันทึกการปฏิบัติงาน'; // !!! VERIFY THIS NAME !!!
        const loggingTimelineStep = await TimelineStep.findOne({
          where: { 
            student_id: studentIdToSeed, 
            type: 'internship',
            name: loggingStepName 
          },
          transaction
        });

        if (loggingTimelineStep) {
          if (loggingTimelineStep.status !== 'completed') {
            await loggingTimelineStep.update({ status: 'completed' }, { transaction });
            console.log(`Updated timeline step "${loggingTimelineStep.name}" to "completed".`);
          } else {
            console.log(`Timeline step "${loggingTimelineStep.name}" is already "completed".`);
          }
        } else {
          console.warn(`Timeline step "${loggingStepName}" not found for student ID ${studentIdToSeed}.`);
        }

        // Find TimelineStep for the report submission step
        const reportStepName = 'ส่งรายงานฝึกงาน'; // !!! VERIFY THIS NAME !!!
        const reportTimelineStep = await TimelineStep.findOne({
          where: { 
            student_id: studentIdToSeed, 
            type: 'internship',
            name: reportStepName 
          },
          transaction
        });

        if (reportTimelineStep) {
          if (reportTimelineStep.status !== 'in_progress') {
            await reportTimelineStep.update({ status: 'in_progress' }, { transaction });
            console.log(`Updated timeline step "${reportTimelineStep.name}" to "in_progress".`);
          } else {
            console.log(`Timeline step "${reportTimelineStep.name}" is already "in_progress".`);
          }
        } else {
          console.warn(`Timeline step "${reportStepName}" not found for student ID ${studentIdToSeed}.`);
        }
      } else {
        console.log(`Total hours for student ID ${studentIdToSeed} (${currentTotalHours}) are less than ${requiredHours}. Timeline not updated yet.`);
      }

      await transaction.commit();
      console.log(`Successfully processed logbook seeding for student ID ${studentIdToSeed}.`);

    } catch (error) {
      await transaction.rollback();
      console.error('Error seeding logbook completion:', error);
      throw error;
    }
  },

  async down(queryInterface, SequelizeInstance) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const studentIdToSeed = 32;
      const { Op } = require('sequelize'); // Import Op directly
      
      // Delete only entries added by this seeder
      const deletedLogsCount = await InternshipLogbook.destroy({
        where: {
          student_id: studentIdToSeed,
          work_description: { [Op.like]: `%(เพิ่มโดย seeder)` } // Use imported Op
        },
        transaction
      });
      console.log(`Deleted ${deletedLogsCount} internship logbook entries for student ID ${studentIdToSeed}.`);

      // Because it's complex to determine the exact previous state of timeline steps,
      // we don't attempt to revert them here automatically.
      console.log(`Timeline steps for student ID ${studentIdToSeed} will need manual review to ensure they're in the correct state.`);

      await transaction.commit();
      console.log(`Successfully reverted logbook completion seed for student ID ${studentIdToSeed}.`);
    } catch (error) {
      await transaction.rollback();
      console.error('Error reverting logbook seed:', error);
      throw error;
    }
  }
};
