'use strict';

/**
 * Seeder สำหรับเพิ่มข้อมูล logbook ให้กับนักศึกษา ID 42 และ internship_id 25
 * เริ่มบันทึกตั้งแต่วันที่ 2025-04-21 ถึงวันที่ 2025-05-09
 * ยังไม่มีการอนุมัติจากหัวหน้างาน
 */

const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
dayjs.extend(utc);
dayjs.extend(timezone);

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // ข้อมูลหลักที่ต้องระบุ
      const studentId = 42;  // รหัสนักศึกษา
      const internshipId = 25; // รหัสการฝึกงาน
      const startDate = dayjs('2025-04-21'); // วันที่เริ่มต้น (21 เมษายน 2025)
      const endDate = dayjs('2025-05-09'); // วันที่สิ้นสุด (9 พฤษภาคม 2025)
      const hoursPerDay = 8;  // จำนวนชั่วโมงต่อวัน
      const makeApproved = false; // ไม่มีการอนุมัติจากหัวหน้างาน
      
      console.log(`จะสร้างบันทึกตั้งแต่วันที่ ${startDate.format('YYYY-MM-DD')} ถึง ${endDate.format('YYYY-MM-DD')} สำหรับนักศึกษา ID ${studentId}`);

      // รายการบันทึกที่จะสร้าง
      const logEntries = [];
      let currentDate = startDate;

      // วนลูปสร้างข้อมูลตั้งแต่วันเริ่มต้นจนถึงวันสิ้นสุด
      while (currentDate.isSame(endDate) || currentDate.isBefore(endDate)) {
        // ข้ามวันหยุด (เสาร์-อาทิตย์)
        if (currentDate.day() !== 0 && currentDate.day() !== 6) { // ไม่ใช่วันอาทิตย์และวันเสาร์
          // สร้างชื่อวันภาษาไทย
          const thaiDays = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];
          const thaiDay = thaiDays[currentDate.day()];
          
          // สร้างข้อมูลสำหรับบันทึกแต่ละวัน
          const workDateStr = currentDate.format('YYYY-MM-DD');
          const nowStr = dayjs().format('YYYY-MM-DD HH:mm:ss');

          // เวลาเข้า-ออก (สุ่มในช่วงที่เหมาะสม)
          let timeInHour = 8 + Math.floor(Math.random() * 2); // 8-9 น.
          let timeInMinute = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, 45
          const timeIn = `${timeInHour < 10 ? '0' + timeInHour : timeInHour}:${timeInMinute < 10 ? '0' + timeInMinute : timeInMinute}`;

          let timeOutHour = 16 + Math.floor(Math.random() * 2); // 16-17 น.
          let timeOutMinute = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, 45
          const timeOut = `${timeOutHour < 10 ? '0' + timeOutHour : timeOutHour}:${timeOutMinute < 10 ? '0' + timeOutMinute : timeOutMinute}`;

          // สร้างรายการงานตามวัน
          const daysSinceStart = currentDate.diff(startDate, 'day');

          // สร้างคำอธิบายที่แตกต่างกันตามวัน
          let taskName = tasks[taskIndex];
          let taskDescription = `งานฝึกงาน${taskName} ประจำ${thaiDay}ที่ ${currentDate.format('DD/MM/YYYY')}`;
          let learningOutcome = `ได้เรียนรู้เกี่ยวกับ${taskName} และการทำงานในสภาพแวดล้อมจริง`;
          
          // เพิ่มข้อมูลเข้าไปในรายการบันทึก
          logEntries.push({
            workDate: workDateStr,
            logTitle: `บันทึกการฝึกงานวันที่ ${workDateStr} - ${taskName}`,
            timeIn: timeIn,
            timeOut: timeOut,
            workHours: hoursPerDay,
            workDescription: taskDescription,
            learningOutcome: learningOutcome,
            problems: daysSinceStart % 4 === 0 ? 'พบปัญหาในการทำงานบางส่วน' : 'ไม่พบปัญหา',
            solutions: daysSinceStart % 4 === 0 ? 'แก้ไขปัญหาโดยปรึกษาพี่เลี้ยง' : 'ไม่มี',
            supervisorApproved: makeApproved,
            advisorApproved: makeApproved,
            supervisorComment: null, // ไม่มีความคิดเห็นจากหัวหน้างานเพราะยังไม่ได้อนุมัติ
            advisorComment: null, // ไม่มีความคิดเห็นจากอาจารย์ที่ปรึกษาเพราะยังไม่ได้อนุมัติ
            createdAt: nowStr,
            updatedAt: nowStr
          });
        }
        
        // เลื่อนวันถัดไป
        currentDate = currentDate.add(1, 'day');
      }

      // สร้างคำสั่ง SQL สำหรับการ INSERT ข้อมูล
      if (logEntries.length > 0) {
        let bulkInsertSQL = 'INSERT INTO `internship_logbooks` (`student_id`, `internship_id`, `work_date`, `log_title`, `work_description`, `learning_outcome`, `work_hours`, `problems`, `solutions`, `supervisor_approved`, `advisor_approved`, `time_in`, `time_out`, `created_at`, `updated_at`) VALUES ';
        
        const values = logEntries.map(entry => {
          return `(${studentId}, ${internshipId}, '${entry.workDate}', '${entry.logTitle.replace(/'/g, "\\'")}', '${entry.workDescription.replace(/'/g, "\\'")}', '${entry.learningOutcome.replace(/'/g, "\\'")}', ${entry.workHours}, '${entry.problems.replace(/'/g, "\\'")}', '${entry.solutions.replace(/'/g, "\\'")}', ${entry.supervisorApproved}, ${entry.advisorApproved}, '${entry.timeIn}', '${entry.timeOut}', '${entry.createdAt}', '${entry.updatedAt}')`;
        });
        
        bulkInsertSQL += values.join(', ');
        await queryInterface.sequelize.query(bulkInsertSQL, { transaction });
        console.log(`สร้างบันทึกจำนวน ${logEntries.length} รายการสำเร็จ`);
      }

      // อัปเดตสถานะขั้นตอนการฝึกงาน
      const loggingStepName = 'เริ่มฝึกงานและบันทึกการปฏิบัติงาน';
      
      // อัปเดตขั้นตอนการบันทึกการปฏิบัติงานให้เป็น in_progress (เนื่องจากยังไม่ได้รับการอนุมัติ)
      await queryInterface.sequelize.query(`
        UPDATE timeline_steps
        SET 
          status = 'in_progress',
          updated_at = NOW()
        WHERE 
          student_id = ${studentId}
          AND type = 'internship'
          AND name = '${loggingStepName}'
      `, { transaction });

      console.log(`อัปเดตสถานะขั้นตอนการฝึกงานสำหรับนักศึกษา ID ${studentId} เรียบร้อยแล้ว`);

      await transaction.commit();
      console.log('สร้างข้อมูล Logbook สำเร็จ');
    } catch (error) {
      await transaction.rollback();
      console.error('เกิดข้อผิดพลาด:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const studentId = 42;
      const internshipId = 25;
      
      // ลบข้อมูล Logbook ของนักศึกษาคนนี้
      const deleteQuery = `
        DELETE FROM internship_logbooks 
        WHERE student_id = ${studentId} 
        AND internship_id = ${internshipId}
      `;
      
      const [deletedCount] = await queryInterface.sequelize.query(deleteQuery, { transaction });
      console.log(`ลบบันทึก Logbook จำนวน ${deletedCount} รายการสำเร็จ`);

      // คืนค่าสถานะขั้นตอนการฝึกงาน (ตั้งค่าให้เริ่มฝึกงานเป็น in_progress)
      const loggingStepName = 'เริ่มฝึกงานและบันทึกการปฏิบัติงาน';

      await queryInterface.sequelize.query(`
        UPDATE timeline_steps
        SET 
          status = 'in_progress',
          updated_at = NOW()
        WHERE 
          student_id = ${studentId}
          AND type = 'internship'
          AND name = '${loggingStepName}'
      `, { transaction });

      console.log(`คืนค่าสถานะขั้นตอนการฝึกงานสำหรับนักศึกษา ID ${studentId} เรียบร้อยแล้ว`);

      await transaction.commit();
      console.log('ยกเลิกการสร้างข้อมูล Logbook สำเร็จ');
    } catch (error) {
      await transaction.rollback();
      console.error('เกิดข้อผิดพลาดในการยกเลิก:', error);
      throw error;
    }
  }
};