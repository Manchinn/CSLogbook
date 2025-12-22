'use strict';
const { Op } = require('sequelize');

module.exports = {
  async up (queryInterface, Sequelize) {
    const now = new Date();
    const internshipSteps = [
      {
        workflow_type: 'internship',
        step_key: 'INTERNSHIP_ELIGIBILITY_MET',
        step_order: 1,
        title: 'มีสิทธิ์ลงทะเบียนฝึกงาน',
        description_template: 'คุณมีคุณสมบัติครบถ้วนในการลงทะเบียนฝึกงาน',
        created_at: now,
        updated_at: now
      },
      {
        workflow_type: 'internship',
        step_key: 'INTERNSHIP_CS05_SUBMITTED',
        step_order: 2,
        title: 'ยื่นคำร้องฝึกงาน (คพ.05)',
        description_template: 'นักศึกษาได้ยื่นเอกสาร คพ.05 เพื่อขออนุมัติการฝึกงานแล้ว',
        created_at: now,
        updated_at: now
      },
      {
        workflow_type: 'internship',
        step_key: 'INTERNSHIP_CS05_APPROVED',
        step_order: 3,
        title: 'คพ.05 ได้รับการอนุมัติ',
        description_template: 'คำร้อง คพ.05 ของคุณได้รับการอนุมัติแล้ว โปรดดำเนินการขั้นตอนต่อไป',
        created_at: now,
        updated_at: now
      },
      {
        workflow_type: 'internship',
        step_key: 'INTERNSHIP_COMPANY_RESPONSE_PENDING',
        step_order: 4,
        title: 'รอหนังสือตอบรับจากสถานประกอบการ',
        description_template: 'โปรดติดต่อสถานประกอบการและอัปโหลดหนังสือตอบรับ',
        created_at: now,
        updated_at: now
      },
      {
        workflow_type: 'internship',
        step_key: 'INTERNSHIP_COMPANY_RESPONSE_RECEIVED',
        step_order: 5,
        title: 'ได้รับหนังสือตอบรับแล้ว',
        description_template: 'ระบบได้รับหนังสือตอบรับจากสถานประกอบการของคุณแล้ว',
        created_at: now,
        updated_at: now
      },
      {
        workflow_type: 'internship',
        step_key: 'INTERNSHIP_AWAITING_START',
        step_order: 6,
        title: 'รอเริ่มการฝึกงาน',
        description_template: 'เตรียมตัวเริ่มการฝึกงานตามกำหนดการ',
        created_at: now,
        updated_at: now
      },
      {
        workflow_type: 'internship',
        step_key: 'INTERNSHIP_IN_PROGRESS',
        step_order: 7,
        title: 'อยู่ระหว่างการฝึกงาน',
        description_template: 'กำลังดำเนินการฝึกงาน บันทึกการปฏิบัติงานประจำวัน',
        created_at: now,
        updated_at: now
      },
      {
        workflow_type: 'internship',
        step_key: 'INTERNSHIP_SUMMARY_PENDING',
        step_order: 8,
        title: 'รอส่งเอกสารสรุปผลการฝึกงาน',
        description_template: 'เมื่อสิ้นสุดการฝึกงาน โปรดส่งเอกสารสรุปผลและรายงาน',
        created_at: now,
        updated_at: now
      },
      {
        workflow_type: 'internship',
        step_key: 'INTERNSHIP_COMPLETED',
        step_order: 9,
        title: 'การฝึกงานเสร็จสมบูรณ์',
        description_template: 'กระบวนการฝึกงานทั้งหมดของคุณเสร็จสิ้นแล้ว',
        created_at: now,
        updated_at: now
      }
    ];

    // Check existing steps to avoid duplicates
    const existingSteps = await queryInterface.sequelize.query(
      `SELECT step_key FROM workflow_step_definitions WHERE workflow_type = 'internship'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    
    const existingKeys = new Set(existingSteps.map(s => s.step_key));
    const newSteps = internshipSteps.filter(s => !existingKeys.has(s.step_key));

    if (newSteps.length > 0) {
      await queryInterface.bulkInsert('workflow_step_definitions', newSteps, {});
      console.log(`✅ Restored ${newSteps.length} internship steps`);
    } else {
      console.log('ℹ️ All internship steps already exist');
    }
  },

  async down (queryInterface, Sequelize) {
    // We don't necessarily want to delete them on down if they were restored, 
    // but for consistency we can remove the ones we added. 
    // However, since we're doing a safe insert, a safe delete is harder to track without ID.
    // We'll skip deletion to avoid removing steps that might have been there originally (though they weren't).
  }
};
