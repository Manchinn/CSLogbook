'use strict';

/**
 * Seeder เพื่ออัปเดตสถานะบันทึกฝึกงานทั้งหมดให้ได้รับการอนุมัติ
 * สามารถระบุ student_id ที่ต้องการอัปเดตสถานะได้
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // ระบุ student_id ที่ต้องการอัปเดต (เช่น 32) หรือไม่ระบุเพื่ออัปเดตทั้งหมด
      const studentId = 32;  // แก้ไขเป็น null หากต้องการอัปเดตทุกคน

      // สร้างเงื่อนไขสำหรับการค้นหาบันทึก
      const whereCondition = {};
      if (studentId) {
        whereCondition.student_id = studentId;
      }

      // อัปเดตสถานะการอนุมัติของบันทึกฝึกงาน
      const [updatedRowCount] = await queryInterface.sequelize.query(`
        UPDATE internship_logbooks
        SET 
          supervisor_approved = true,
          advisor_approved = true,
          supervisor_comment = COALESCE(supervisor_comment, 'ผลการปฏิบัติงานดีมาก ทำงานได้ตามเป้าหมาย (อนุมัติโดย seeder)'),
          advisor_comment = COALESCE(advisor_comment, 'บันทึกเรียบร้อย (อนุมัติโดย seeder)'),
          updated_at = NOW()
        WHERE 
          ${studentId ? `student_id = ${studentId}` : '1=1'}
      `, { transaction });

      console.log(`อัปเดต ${updatedRowCount} บันทึกให้มีสถานะได้รับการอนุมัติแล้ว`);

      // อัปเดต TimelineStep สำหรับขั้นตอนบันทึกการปฏิบัติงานให้เป็น completed และขั้นตอนส่งรายงานให้เป็น in_progress
      if (studentId) {
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

        console.log(`อัปเดตสถานะขั้นตอนการฝึกงานสำหรับนักศึกษา ID ${studentId} เรียบร้อยแล้ว`);
      }

      await transaction.commit();
      console.log('สำเร็จ: อัปเดตสถานะบันทึกฝึกงานเรียบร้อยแล้ว');
    } catch (error) {
      await transaction.rollback();
      console.error('เกิดข้อผิดพลาด:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // ระบุ student_id ที่ต้องการคืนค่ากลับ (เช่น 32) หรือไม่ระบุเพื่อคืนค่ากลับทั้งหมด
      const studentId = 32;  // แก้ไขเป็น null หากต้องการคืนค่ากลับทุกคน

      // สร้างเงื่อนไขสำหรับการค้นหาบันทึก
      const whereCondition = {};
      if (studentId) {
        whereCondition.student_id = studentId;
      }

      // คืนค่าสถานะการอนุมัติของบันทึกที่มีการอัปเดตโดย seeder นี้
      const [updatedRowCount] = await queryInterface.sequelize.query(`
        UPDATE internship_logbooks
        SET 
          supervisor_approved = false,
          advisor_approved = false,
          supervisor_comment = CASE WHEN supervisor_comment LIKE '%อนุมัติโดย seeder%' THEN NULL ELSE supervisor_comment END,
          advisor_comment = CASE WHEN advisor_comment LIKE '%อนุมัติโดย seeder%' THEN NULL ELSE advisor_comment END,
          updated_at = NOW()
        WHERE 
          ${studentId ? `student_id = ${studentId}` : '1=1'}
          AND (supervisor_comment LIKE '%อนุมัติโดย seeder%' OR advisor_comment LIKE '%อนุมัติโดย seeder%')
      `, { transaction });

      console.log(`คืนค่าสถานะการอนุมัติของ ${updatedRowCount} บันทึกเรียบร้อยแล้ว`);

      // ไม่คืนค่า timeline steps อัตโนมัติเนื่องจากอาจซับซ้อนและไม่แน่ใจสถานะก่อนหน้า
      console.log('หมายเหตุ: ไม่ได้คืนค่าสถานะขั้นตอนการฝึกงานอัตโนมัติ โปรดตรวจสอบและอัปเดตด้วยตนเอง');

      await transaction.commit();
      console.log('สำเร็จ: คืนค่าสถานะบันทึกฝึกงานเรียบร้อยแล้ว');
    } catch (error) {
      await transaction.rollback();
      console.error('เกิดข้อผิดพลาด:', error);
      throw error;
    }
  }
};