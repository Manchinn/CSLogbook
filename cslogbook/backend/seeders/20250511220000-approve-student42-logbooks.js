'use strict';

/**
 * Seeder สำหรับอนุมัติบันทึกการฝึกงานที่มีอยู่แล้ว
 * - สามารถระบุ student_id และ internship_id ที่ต้องการอนุมัติ
 * - สามารถระบุช่วงวันที่ต้องการอนุมัติ (อนุมัติบางวัน)
 * - เพิ่มความคิดเห็นจากผู้อนุมัติโดยอัตโนมัติ
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
      const approveStartDate = dayjs('2025-04-21'); // วันที่เริ่มต้นที่ต้องการอนุมัติ
      const approveEndDate = dayjs('2025-05-09'); // วันที่สิ้นสุดที่ต้องการอนุมัติ (เฉพาะตั้งแต่ 21 เม.ย. - 9 พ.ค.)

      console.log(`เริ่มต้นการอนุมัติบันทึกการฝึกงานสำหรับนักศึกษา ID ${studentId} ตั้งแต่วันที่ ${approveStartDate.format('YYYY-MM-DD')} ถึง ${approveEndDate.format('YYYY-MM-DD')}`);

      // อนุมัติบันทึกฝึกงานตามช่วงวันที่กำหนด
      let updateQuery = `
        UPDATE internship_logbooks
        SET 
          supervisor_approved = true,
          advisor_approved = true,
          supervisor_comment = CASE 
                                 WHEN work_hours >= 8 THEN 'ผลการปฏิบัติงานดีมาก ทำงานตามเป้าหมาย (อนุมัติโดย seeder)'
                                 ELSE 'ผลการปฏิบัติงานดี (อนุมัติโดย seeder)'
                               END,
          advisor_comment = 'เห็นชอบตามพี่เลี้ยง (อนุมัติโดย seeder)',
          updated_at = NOW()
        WHERE 
          student_id = ${studentId}
          AND internship_id = ${internshipId}
          AND work_date >= '${approveStartDate.format('YYYY-MM-DD')}'
          AND work_date <= '${approveEndDate.format('YYYY-MM-DD')}'
      `;

      const [updatedCount] = await queryInterface.sequelize.query(updateQuery, { transaction });
      
      console.log(`อนุมัติบันทึกการฝึกงานจำนวน ${updatedCount} รายการสำเร็จ`);

      // ตรวจสอบจำนวนชั่วโมงรวมที่อนุมัติแล้ว
      const hoursSummaryQuery = `
        SELECT SUM(work_hours) as total_approved_hours
        FROM internship_logbooks
        WHERE 
          student_id = ${studentId}
          AND supervisor_approved = true
      `;
      
      const [hoursSummary] = await queryInterface.sequelize.query(hoursSummaryQuery, { 
        type: Sequelize.QueryTypes.SELECT,
        transaction 
      });
      
      const totalApprovedHours = parseFloat(hoursSummary?.total_approved_hours || 0);
      console.log(`จำนวนชั่วโมงที่ได้รับการอนุมัติทั้งหมด: ${totalApprovedHours} ชั่วโมง`);
      
      // อัปเดตสถานะขั้นตอนการฝึกงานขึ้นอยู่กับจำนวนชั่วโมงที่อนุมัติ
      // หากได้รับการอนุมัติครบ 240 ชั่วโมงขึ้นไป ให้เปลี่ยนสถานะเป็น completed
      if (totalApprovedHours >= 240) {
        const loggingStepName = 'เริ่มฝึกงานและบันทึกการปฏิบัติงาน';
        const reportStepName = 'ส่งรายงานฝึกงาน';
        
        // อัปเดตขั้นตอนการบันทึกการปฏิบัติงานให้เป็น completed
        await queryInterface.sequelize.query(`
          UPDATE timeline_steps
          SET 
            status = 'completed',
            updated_at = NOW()
          WHERE 
            student_id = ${studentId}
            AND type = 'internship'
            AND name = '${loggingStepName}'
        `, { transaction });

        // อัปเดตขั้นตอนการส่งรายงานให้เป็น in_progress
        await queryInterface.sequelize.query(`
          UPDATE timeline_steps
          SET 
            status = 'in_progress',
            updated_at = NOW()
          WHERE 
            student_id = ${studentId}
            AND type = 'internship'
            AND name = '${reportStepName}'
        `, { transaction });

        console.log(`อัปเดตสถานะขั้นตอนการฝึกงานเป็น "completed" เรียบร้อยแล้ว เนื่องจากมีชั่วโมงครบ ${totalApprovedHours} ชั่วโมง`);
      } else {
        console.log(`ยังไม่อัปเดตสถานะขั้นตอนการฝึกงาน เนื่องจากมีชั่วโมงไม่ครบ ${totalApprovedHours}/240 ชั่วโมง`);
      }

      await transaction.commit();
      console.log('อนุมัติบันทึกการฝึกงานเสร็จสิ้น');
    } catch (error) {
      await transaction.rollback();
      console.error('เกิดข้อผิดพลาด:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // ข้อมูลหลักที่ต้องระบุ
      const studentId = 42;  // รหัสนักศึกษา
      const internshipId = 25; // รหัสการฝึกงาน
      const approveStartDate = dayjs('2025-04-21'); // วันที่เริ่มต้นที่ต้องการยกเลิกการอนุมัติ
      const approveEndDate = dayjs('2025-05-01'); // วันที่สิ้นสุดที่ต้องการยกเลิกการอนุมัติ
      
      // ยกเลิกการอนุมัติบันทึกฝึกงานตามช่วงวันที่กำหนด
      let updateQuery = `
        UPDATE internship_logbooks
        SET 
          supervisor_approved = false,
          advisor_approved = false,
          supervisor_comment = CASE WHEN supervisor_comment LIKE '%อนุมัติโดย seeder%' THEN NULL ELSE supervisor_comment END,
          advisor_comment = CASE WHEN advisor_comment LIKE '%อนุมัติโดย seeder%' THEN NULL ELSE advisor_comment END,
          updated_at = NOW()
        WHERE 
          student_id = ${studentId}
          AND internship_id = ${internshipId}
          AND work_date >= '${approveStartDate.format('YYYY-MM-DD')}'
          AND work_date <= '${approveEndDate.format('YYYY-MM-DD')}'
          AND (supervisor_comment LIKE '%อนุมัติโดย seeder%' OR advisor_comment LIKE '%อนุมัติโดย seeder%')
      `;

      const [updatedCount] = await queryInterface.sequelize.query(updateQuery, { transaction });
      
      console.log(`ยกเลิกการอนุมัติบันทึกจำนวน ${updatedCount} รายการสำเร็จ`);

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

      // คืนค่าสถานะขั้นตอนการส่งรายงาน
      const reportStepName = 'ส่งรายงานฝึกงาน';

      await queryInterface.sequelize.query(`
        UPDATE timeline_steps
        SET 
          status = 'waiting',
          updated_at = NOW()
        WHERE 
          student_id = ${studentId}
          AND type = 'internship'
          AND name = '${reportStepName}'
      `, { transaction });

      console.log(`คืนค่าสถานะขั้นตอนการฝึกงานสำหรับนักศึกษา ID ${studentId} เรียบร้อยแล้ว`);

      await transaction.commit();
      console.log('ยกเลิกการอนุมัติบันทึกการฝึกงานเสร็จสิ้น');
    } catch (error) {
      await transaction.rollback();
      console.error('เกิดข้อผิดพลาดในการยกเลิก:', error);
      throw error;
    }
  }
};