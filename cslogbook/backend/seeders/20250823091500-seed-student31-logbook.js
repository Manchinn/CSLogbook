'use strict';

const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Seeder สำหรับเพิ่มข้อมูล logbook ให้นักศึกษา ID 31
 * อ้างอิงรูปแบบจากไฟล์ seed นักศึกษา 32 (random time, โครงสร้าง field แบบเดียวกัน)
 * เงื่อนไขเพิ่มเติม: 5 บันทึกล่าสุด (วันที่ท้ายช่วง) ให้คงสถานะ pending (supervisor_approved=0 / advisor_approved=false)
 * ที่เหลือให้เป็น approved
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // =====================================================================================
      // == ข้อมูลสำคัญสำหรับ seeder นี้ ==
      // =====================================================================================
      const studentId = 31;      // รหัสนักศึกษา
      const internshipId = 58;   // รหัสการฝึกงาน (ตามที่ระบุให้ใช้)
      // =====================================================================================

      const startDate = dayjs('2025-07-15'); // วันที่เริ่มต้น
      const endDate = dayjs('2025-10-29');   // วันที่สิ้นสุด
      const hoursPerDay = 8;                 // จำนวนชั่วโมงทำงานต่อวัน
      const pendingCount = 5;                // จำนวนบันทึกล่าสุดให้ pending

      console.log(`[Seeder] เริ่มสร้างบันทึกการฝึกงานสำหรับนักศึกษา ID ${studentId} (Internship ID: ${internshipId})`);
      console.log(`[Seeder] ช่วงวันที่: ${startDate.format('YYYY-MM-DD')} ถึง ${endDate.format('YYYY-MM-DD')}`);

      const logEntries = [];
      let currentDate = startDate;

      // วนลูปเพื่อสร้างข้อมูล logbook สำหรับแต่ละวัน (รวมเสาร์-อาทิตย์ เพื่อให้ "ครบทุกวัน")
      while (currentDate.isSame(endDate) || currentDate.isBefore(endDate)) {
        const workDateStr = currentDate.format('YYYY-MM-DD');
        const nowStr = dayjs().tz('Asia/Bangkok').format('YYYY-MM-DD HH:mm:ss');

        // เวลาเข้า (สุ่มในช่วง 08:00 - 08:45 ทุก 15 นาที)
        const timeInHour = 8;
        const timeInMinute = Math.floor(Math.random() * 4) * 15; // 0,15,30,45
        const timeIn = `${String(timeInHour).padStart(2, '0')}:${String(timeInMinute).padStart(2, '0')}`;

        // เวลาออก = เวลาเข้า + hoursPerDay
        const timeOutObject = dayjs(`${workDateStr} ${timeIn}`).add(hoursPerDay, 'hour');
        const timeOut = timeOutObject.format('HH:mm');

        const logTitle = `บันทึกการฝึกงานวันที่ ${currentDate.format('DD/MM/YYYY')}`;
        const workDescription = `รายละเอียดการปฏิบัติงานวันที่ ${currentDate.format('dddd, DD MMMM YYYY')} ของนักศึกษา ID ${studentId}`;
        const learningOutcome = `ได้เรียนรู้และปฏิบัติงานจริงในวันที่ ${currentDate.format('DD/MM/YYYY')}`;
        const problems = 'ไม่มีปัญหาสำคัญ';
        const solutions = 'ดำเนินงานตามแผน';

        logEntries.push({
          student_id: studentId,
          internship_id: internshipId,
          work_date: workDateStr,
          log_title: logTitle,
          work_description: workDescription,
          learning_outcome: learningOutcome,
          work_hours: hoursPerDay,
          problems: problems,
          solutions: solutions,
          supervisor_approved: 1,      // default approved จะปรับท้ายรายการ
          advisor_approved: true,      // default approved จะปรับท้ายรายการ
          time_in: timeIn,
          time_out: timeOut,
          supervisor_comment: null,
          advisor_comment: null,
          created_at: nowStr,
          updated_at: nowStr
        });

        currentDate = currentDate.add(1, 'day'); // วันถัดไป
      }

      if (logEntries.length === 0) {
        console.log('[Seeder] ไม่มีวันให้สร้าง logbook');
        await transaction.rollback();
        return;
      }

      // ปรับ 5 รายการสุดท้ายให้ pending
      const markPending = Math.min(pendingCount, logEntries.length);
      for (let i = 1; i <= markPending; i++) {
        const idx = logEntries.length - i;
        logEntries[idx].supervisor_approved = 0; // pending
        logEntries[idx].advisor_approved = false; // pending
      }

      // สร้าง bulk INSERT SQL
      let bulkInsertSQL = 'INSERT INTO `internship_logbooks` (`student_id`, `internship_id`, `work_date`, `log_title`, `work_description`, `learning_outcome`, `work_hours`, `problems`, `solutions`, `supervisor_approved`, `advisor_approved`, `time_in`, `time_out`, `supervisor_comment`, `advisor_comment`, `created_at`, `updated_at`) VALUES ';
      const valueStrings = logEntries.map(entry => {
        return `(${entry.student_id}, ${entry.internship_id}, '${entry.work_date}', '${entry.log_title.replace(/'/g, "\\'")}', '${entry.work_description.replace(/'/g, "\\'")}', '${entry.learning_outcome.replace(/'/g, "\\'")}', ${entry.work_hours}, '${entry.problems.replace(/'/g, "\\'")}', '${entry.solutions.replace(/'/g, "\\'")}', ${entry.supervisor_approved}, ${entry.advisor_approved}, '${entry.time_in}', '${entry.time_out}', ${entry.supervisor_comment === null ? 'NULL' : "'" + entry.supervisor_comment.replace(/'/g, "\\'") + "'"}, ${entry.advisor_comment === null ? 'NULL' : "'" + entry.advisor_comment.replace(/'/g, "\\'") + "'"}, '${entry.created_at}', '${entry.updated_at}')`;
      });
      bulkInsertSQL += valueStrings.join(', ');

      await queryInterface.sequelize.query(bulkInsertSQL, { transaction });
      console.log(`[Seeder] สร้างบันทึก Logbook สำหรับนักศึกษา ID ${studentId} จำนวน ${logEntries.length} รายการ (pending ${markPending}) สำเร็จ`);

      await transaction.commit();
      console.log('[Seeder] เสร็จสิ้น');
    } catch (error) {
      await transaction.rollback();
      console.error(`[Seeder] เกิดข้อผิดพลาดในการสร้างข้อมูล Logbook สำหรับนักศึกษา ID 31:`, error);
      if (error.original) {
        console.error('[Seeder] Original Error:', error.original);
      }
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const studentId = 31;
      const internshipId = 58;
      const startDate = '2025-06-01';
      const endDate = '2025-06-30';

      console.log(`[Seeder] เริ่มการยกเลิกข้อมูล Logbook สำหรับนักศึกษา ID ${studentId} (Internship ID: ${internshipId})`);
      console.log(`[Seeder] ช่วงวันที่: ${startDate} ถึง ${endDate}`);

      const deleteQuery = `
        DELETE FROM internship_logbooks
        WHERE student_id = ${studentId}
        AND internship_id = ${internshipId}
        AND work_date BETWEEN '${startDate}' AND '${endDate}'
      `;

      const [results, metadata] = await queryInterface.sequelize.query(deleteQuery, { transaction });
      console.log(`[Seeder] ลบบันทึก Logbook (student_id=${studentId}) สำเร็จ`);

      await transaction.commit();
      console.log('[Seeder] การยกเลิกข้อมูล Logbook สำหรับนักศึกษา ID 31 เสร็จสมบูรณ์');
    } catch (error) {
      await transaction.rollback();
      console.error('[Seeder] เกิดข้อผิดพลาดในการยกเลิกข้อมูล Logbook:', error);
      if (error.original) {
        console.error('[Seeder] Original Error:', error.original);
      }
      throw error;
    }
  }
};
