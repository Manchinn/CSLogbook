'use strict';

const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Seeder สำหรับเพิ่มข้อมูล logbook ให้นักศึกษา ID 155
 * เริ่มบันทึกตั้งแต่วันที่ 2025-04-17 ถึงวันที่ 2025-04-25
 * ข้อมูลที่สร้างขึ้นจะยังไม่มีการอนุมัติจากหัวหน้างานหรืออาจารย์ที่ปรึกษา
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // =====================================================================================
      // == ข้อมูลสำคัญที่ต้องตรวจสอบและอาจจะต้องแก้ไขให้ตรงกับข้อมูลในระบบของคุณ ==
      // =====================================================================================
      const studentId = 155; // รหัสนักศึกษา
      const internshipId = 37; // << -- !! กรุณาตรวจสอบและแก้ไข รหัสการฝึกงาน (internship_id) ให้ถูกต้อง !!
      // =====================================================================================

      const startDate = dayjs('2025-04-17'); // วันที่เริ่มต้น (17 เมษายน 2025)
      const endDate = dayjs('2025-04-25');   // วันที่สิ้นสุด (25 เมษายน 2025)
      const hoursPerDay = 8;  // จำนวนชั่วโมงทำงานต่อวัน
      const makeApproved = false; // สถานะการอนุมัติ (false = ยังไม่อนุมัติ)

      console.log(`[Seeder] เริ่มสร้างบันทึกการฝึกงานสำหรับนักศึกษา ID ${studentId} (Internship ID: ${internshipId})`);
      console.log(`[Seeder] ช่วงวันที่: ${startDate.format('YYYY-MM-DD')} ถึง ${endDate.format('YYYY-MM-DD')}`);

      const logEntries = [];
      let currentDate = startDate;

      // วนลูปเพื่อสร้างข้อมูล logbook สำหรับแต่ละวันในช่วงที่กำหนด
      while (currentDate.isSame(endDate) || currentDate.isBefore(endDate)) {
        // ข้ามวันหยุดสุดสัปดาห์ (วันเสาร์และวันอาทิตย์)
        if (currentDate.day() !== 0 && currentDate.day() !== 6) { // 0 = Sunday, 6 = Saturday
          const workDateStr = currentDate.format('YYYY-MM-DD');
          const nowStr = dayjs().tz('Asia/Bangkok').format('YYYY-MM-DD HH:mm:ss'); // ใช้เวลาปัจจุบันโซนกรุงเทพ

          // สุ่มเวลาเข้างาน (ระหว่าง 08:00 - 08:45)
          const timeInHour = 8;
          const timeInMinute = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, 45
          const timeIn = `${String(timeInHour).padStart(2, '0')}:${String(timeInMinute).padStart(2, '0')}`;

          // คำนวณเวลาออกงาน (จากเวลาเข้า + จำนวนชั่วโมงทำงาน)
          const timeOutObject = dayjs(`${workDateStr} ${timeIn}`).add(hoursPerDay, 'hour');
          const timeOut = timeOutObject.format('HH:mm');

          const logTitle = `บันทึกการฝึกงานวันที่ ${currentDate.format('DD/MM/YYYY')}`;
          const workDescription = `รายละเอียดการปฏิบัติงานประจำ${currentDate.format('dddd, DD MMMM YYYY')} ของนักศึกษา ID ${studentId}`;
          const learningOutcome = `ได้เรียนรู้เกี่ยวกับการปฏิบัติงานในวันที่ ${currentDate.format('DD/MM/YYYY')} และการปรับตัวเข้ากับสภาพแวดล้อมการทำงานจริง`;
          const problems = 'ไม่พบปัญหาในการปฏิบัติงาน'; // สามารถปรับเปลี่ยนตามความเหมาะสม
          const solutions = 'ดำเนินการตามแผนงานที่วางไว้'; // สามารถปรับเปลี่ยนตามความเหมาะสม

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
            supervisor_approved: makeApproved,
            advisor_approved: makeApproved,
            time_in: timeIn,
            time_out: timeOut,
            supervisor_comment: null,
            advisor_comment: null,
            created_at: nowStr,
            updated_at: nowStr
          });
        }
        currentDate = currentDate.add(1, 'day'); // เลื่อนไปยังวันถัดไป
      }

      if (logEntries.length > 0) {
        // สร้าง query สำหรับ bulk insert
        // สังเกตการใช้ backticks (`) สำหรับชื่อตารางและคอลัมน์ และ single quotes (') สำหรับค่า string
        // และการ escape single quotes ภายในค่า string ด้วย .replace(/'/g, "\\'")
        let bulkInsertSQL = 'INSERT INTO `internship_logbooks` (`student_id`, `internship_id`, `work_date`, `log_title`, `work_description`, `learning_outcome`, `work_hours`, `problems`, `solutions`, `supervisor_approved`, `advisor_approved`, `time_in`, `time_out`, `supervisor_comment`, `advisor_comment`, `created_at`, `updated_at`) VALUES ';

        const valueStrings = logEntries.map(entry => {
          return `(${entry.student_id}, ${entry.internship_id}, '${entry.work_date}', '${entry.log_title.replace(/'/g, "\\'")}', '${entry.work_description.replace(/'/g, "\\'")}', '${entry.learning_outcome.replace(/'/g, "\\'")}', ${entry.work_hours}, '${entry.problems.replace(/'/g, "\\'")}', '${entry.solutions.replace(/'/g, "\\'")}', ${entry.supervisor_approved}, ${entry.advisor_approved}, '${entry.time_in}', '${entry.time_out}', ${entry.supervisor_comment === null ? 'NULL' : "'" + entry.supervisor_comment.replace(/'/g, "\\'") + "'"}, ${entry.advisor_comment === null ? 'NULL' : "'" + entry.advisor_comment.replace(/'/g, "\\'") + "'"}, '${entry.created_at}', '${entry.updated_at}')`;
        });

        bulkInsertSQL += valueStrings.join(', ');
        await queryInterface.sequelize.query(bulkInsertSQL, { transaction });
        console.log(`[Seeder] สร้างบันทึก Logbook จำนวน ${logEntries.length} รายการสำหรับนักศึกษา ID ${studentId} สำเร็จ`);
      } else {
        console.log(`[Seeder] ไม่มีการสร้างบันทึก Logbook (อาจเนื่องมาจากช่วงวันที่ที่ระบุเป็นวันหยุดทั้งหมด)`);
      }

      // อัปเดตสถานะขั้นตอนการฝึกงานใน timeline_steps
      const loggingStepName = 'เริ่มฝึกงานและบันทึกการปฏิบัติงาน'; // ชื่อขั้นตอนที่ต้องการอัปเดต (ตรวจสอบให้แน่ใจว่าชื่อนี้ถูกต้อง)
      const [results, metadata] = await queryInterface.sequelize.query(`
        UPDATE timeline_steps
        SET
          status = 'in_progress',
          updated_at = NOW()
        WHERE
          student_id = ${studentId}
          AND type = 'internship'
          AND name = '${loggingStepName}'
          AND (status != 'completed' AND status != 'approved') -- อัปเดตเฉพาะเมื่อยังไม่ completed หรือ approved
      `, { transaction });

      if (metadata.changedRows > 0) {
         console.log(`[Seeder] อัปเดตสถานะขั้นตอน "${loggingStepName}" เป็น 'in_progress' สำหรับนักศึกษา ID ${studentId} เรียบร้อยแล้ว`);
      } else {
         console.log(`[Seeder] ไม่มีการอัปเดตสถานะขั้นตอน "${loggingStepName}" สำหรับนักศึกษา ID ${studentId} (อาจมีสถานะเป็น 'completed'/'approved' อยู่แล้ว หรือไม่พบขั้นตอน)`);
      }

      await transaction.commit();
      console.log(`[Seeder] การสร้างข้อมูล Logbook สำหรับนักศึกษา ID ${studentId} เสร็จสมบูรณ์`);

    } catch (error) {
      await transaction.rollback();
      console.error(`[Seeder] เกิดข้อผิดพลาดในการสร้างข้อมูล Logbook สำหรับนักศึกษา ID 155:`, error);
      // เพิ่มรายละเอียดของ error ที่เกี่ยวข้องกับ Sequelize โดยเฉพาะถ้ามี
      if (error.original) {
        console.error(`[Seeder] Original Error:`, error.original);
      }
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const studentId = 155;
      const internshipId = 999; // << -- !! กรุณาตรวจสอบและแก้ไข รหัสการฝึกงาน (internship_id) ให้ตรงกับที่ใช้ใน up() !!
      const startDate = '2025-04-17';
      const endDate = '2025-04-25';

      console.log(`[Seeder] เริ่มการยกเลิกข้อมูล Logbook สำหรับนักศึกษา ID ${studentId} (Internship ID: ${internshipId})`);
      console.log(`[Seeder] ช่วงวันที่: ${startDate} ถึง ${endDate}`);

      // ลบข้อมูล Logbook ของนักศึกษาและ internship_id ที่ระบุ ในช่วงวันที่ที่กำหนด
      const deleteQuery = `
        DELETE FROM internship_logbooks
        WHERE student_id = ${studentId}
        AND internship_id = ${internshipId}
        AND work_date BETWEEN '${startDate}' AND '${endDate}'
      `;

      const [results, metadata] = await queryInterface.sequelize.query(deleteQuery, { transaction });
      console.log(`[Seeder] ลบบันทึก Logbook จำนวน ${metadata.rowCount} รายการสำเร็จ`);

      // การคืนค่าสถานะ timeline_steps อาจจะซับซ้อนและขึ้นอยู่กับ logic ของระบบ
      // ในที่นี้จะตั้งค่ากลับเป็น 'pending' หากต้องการ หรืออาจจะปล่อยไว้ให้จัดการด้วยตนเอง
      // ตัวอย่าง: ตั้งค่าขั้นตอน 'เริ่มฝึกงานและบันทึกการปฏิบัติงาน' กลับเป็น 'pending'
      // หากต้องการให้มีความแม่นยำมากขึ้น ควรตรวจสอบสถานะก่อนหน้าการรัน seeder นี้
      const loggingStepName = 'เริ่มฝึกงานและบันทึกการปฏิบัติงาน';
      await queryInterface.sequelize.query(`
        UPDATE timeline_steps
        SET
          status = 'pending', -- หรือ 'not_started' ขึ้นอยู่กับสถานะเริ่มต้นที่เป็นไปได้
          updated_at = NOW()
        WHERE
          student_id = ${studentId}
          AND type = 'internship'
          AND name = '${loggingStepName}'
          AND status = 'in_progress' -- อัปเดตเฉพาะถ้าปัจจุบันเป็น in_progress จาก seeder นี้
      `, { transaction });
      console.log(`[Seeder] คืนค่าสถานะขั้นตอน "${loggingStepName}" (ถ้ามี) สำหรับนักศึกษา ID ${studentId} เรียบร้อยแล้ว`);


      await transaction.commit();
      console.log(`[Seeder] การยกเลิกข้อมูล Logbook สำหรับนักศึกษา ID ${studentId} เสร็จสมบูรณ์`);
    } catch (error) {
      await transaction.rollback();
      console.error(`[Seeder] เกิดข้อผิดพลาดในการยกเลิกข้อมูล Logbook:`, error);
      if (error.original) {
        console.error(`[Seeder] Original Error:`, error.original);
      }
      throw error;
    }
  }
};