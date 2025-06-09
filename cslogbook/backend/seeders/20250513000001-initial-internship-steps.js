'use strict';
const { Op } = require('sequelize');

module.exports = {
  async up (queryInterface, Sequelize) {
    const internshipSteps = [
      {
        workflow_type: 'internship',
        step_key: 'INTERNSHIP_ELIGIBILITY_MET', // หรือ 'READY_TO_REGISTER'
        step_order: 1,
        title: 'มีสิทธิ์ลงทะเบียนฝึกงาน',
        description_template: 'คุณมีคุณสมบัติครบถ้วนในการลงทะเบียนฝึกงาน',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        workflow_type: 'internship',
        step_key: 'INTERNSHIP_CS05_SUBMITTED', // เปลี่ยนจาก PENDING เป็น SUBMITTED เพื่อให้ชัดเจนว่านักศึกษาส่งแล้ว
        step_order: 2,
        title: 'ยื่นคำร้องฝึกงาน (คพ.05)',
        description_template: 'นักศึกษาได้ยื่นเอกสาร คพ.05 เพื่อขออนุมัติการฝึกงานแล้ว',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        workflow_type: 'internship',
        step_key: 'INTERNSHIP_CS05_APPROVAL_PENDING',
        step_order: 3,
        title: 'รอการอนุมัติ คพ.05',
        description_template: 'คำร้อง คพ.05 ของคุณกำลังรอการพิจารณาจากเจ้าหน้าที่/อาจารย์',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        workflow_type: 'internship',
        step_key: 'INTERNSHIP_CS05_APPROVED',
        step_order: 4,
        title: 'คพ.05 ได้รับการอนุมัติ',
        description_template: 'คำร้อง คพ.05 ของคุณได้รับการอนุมัติแล้ว โปรดดำเนินการขั้นตอนต่อไป',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        workflow_type: 'internship',
        step_key: 'INTERNSHIP_COMPANY_RESPONSE_PENDING',
        step_order: 5,
        title: 'รอหนังสือตอบรับจากสถานประกอบการ',
        description_template: 'โปรดติดต่อสถานประกอบการและอัปโหลดหนังสือตอบรับ',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        workflow_type: 'internship',
        step_key: 'INTERNSHIP_COMPANY_RESPONSE_RECEIVED',
        step_order: 6,
        title: 'ได้รับหนังสือตอบรับแล้ว',
        description_template: 'ระบบได้รับหนังสือตอบรับจากสถานประกอบการของคุณแล้ว',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        workflow_type: 'internship',
        step_key: 'INTERNSHIP_AWAITING_START',
        step_order: 7,
        title: 'รอเริ่มการฝึกงาน',
        description_template: 'เตรียมตัวเริ่มการฝึกงานตามกำหนดการ',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        workflow_type: 'internship',
        step_key: 'INTERNSHIP_IN_PROGRESS',
        step_order: 8,
        title: 'อยู่ระหว่างการฝึกงาน',
        description_template: 'กำลังดำเนินการฝึกงาน บันทึกการปฏิบัติงานประจำวัน',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        workflow_type: 'internship',
        step_key: 'INTERNSHIP_SUMMARY_PENDING',
        step_order: 9,
        title: 'รอส่งเอกสารสรุปผลการฝึกงาน',
        description_template: 'เมื่อสิ้นสุดการฝึกงาน โปรดส่งเอกสารสรุปผลและรายงาน',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        workflow_type: 'internship',
        step_key: 'INTERNSHIP_COMPLETED',
        step_order: 10,
        title: 'การฝึกงานเสร็จสมบูรณ์',
        description_template: 'กระบวนการฝึกงานทั้งหมดของคุณเสร็จสิ้นแล้ว',
        created_at: new Date(),
        updated_at: new Date()
      }
    ];
    await queryInterface.bulkInsert('workflow_step_definitions', internshipSteps, {});
  },

  async down (queryInterface, Sequelize) {
    // ลบเฉพาะ step ที่เพิ่มเข้าไปใน up()
    await queryInterface.bulkDelete('workflow_step_definitions', {
      workflow_type: 'internship',
      step_key: { // ลบ step_key ทั้งหมดที่อยู่ใน array นี้
        [Op.in]: [
          'INTERNSHIP_ELIGIBILITY_MET',
          'INTERNSHIP_CS05_SUBMITTED',
          'INTERNSHIP_CS05_APPROVAL_PENDING',
          'INTERNSHIP_CS05_APPROVED',
          'INTERNSHIP_COMPANY_RESPONSE_PENDING',
          'INTERNSHIP_COMPANY_RESPONSE_RECEIVED',
          'INTERNSHIP_AWAITING_START',
          'INTERNSHIP_IN_PROGRESS',
          'INTERNSHIP_SUMMARY_PENDING',
          'INTERNSHIP_COMPLETED'
        ]
      }
    }, {});
  }
};
