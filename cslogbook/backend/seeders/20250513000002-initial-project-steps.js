'use strict';
const { Op } = require('sequelize');

module.exports = {
  async up (queryInterface) {
    const now = new Date();
    const projectSteps = [
      {
        workflow_type: 'project1',
        step_key: 'PROJECT1_ELIGIBILITY_CONFIRMED',
        step_order: 1,
        title: 'ผ่านเกณฑ์โครงงานพิเศษ',
        description_template: 'ยืนยันว่านักศึกษาผ่านเกณฑ์โครงงานพิเศษตามหน่วยกิตขั้นต่ำของหลักสูตร',
        created_at: now,
        updated_at: now
      },
      {
        workflow_type: 'project1',
        step_key: 'PROJECT1_DRAFT_CREATED',
        step_order: 2,
        title: 'สร้างร่างหัวข้อโครงงาน',
        description_template: 'นักศึกษาเริ่มต้นร่างหัวข้อโครงงานและจัดเตรียมรายละเอียดเบื้องต้น',
        created_at: now,
        updated_at: now
      },
      {
        workflow_type: 'project1',
        step_key: 'PROJECT1_TEAM_CONFIRMED',
        step_order: 3,
        title: 'ยืนยันสมาชิกทีมโครงงาน',
        description_template: 'ตรวจสอบให้ทีมโครงงานมีสมาชิกครบตามเกณฑ์และพร้อมทำงานร่วมกัน',
        created_at: now,
        updated_at: now
      },
      {
        workflow_type: 'project1',
        step_key: 'PROJECT1_ADVISOR_CONFIRMED',
        step_order: 4,
        title: 'เลือกอาจารย์ที่ปรึกษา',
        description_template: 'ระบุอาจารย์ที่ปรึกษา (และอาจารย์ร่วม) เพื่อรับผิดชอบโครงงาน',
        created_at: now,
        updated_at: now
      },
      {
        workflow_type: 'project1',
        step_key: 'PROJECT1_IN_PROGRESS',
        step_order: 5,
        title: 'เริ่มดำเนินโครงงาน',
        description_template: 'โครงงานถูกเปิดใช้งานอย่างเป็นทางการและกำลังอยู่ในระหว่างดำเนินการ',
        created_at: now,
        updated_at: now
      },
      {
        workflow_type: 'project1',
        step_key: 'PROJECT1_TOPIC_EXAM_RESULT',
        step_order: 6,
        title: 'สรุปผลการสอบหัวข้อ',
        description_template: 'บันทึกผลการสอบหัวข้อโครงงาน (ผ่านหรือไม่ผ่าน)',
        created_at: now,
        updated_at: now
      },
      {
        workflow_type: 'project1',
        step_key: 'PROJECT1_ARCHIVED',
        step_order: 7,
        title: 'ปิดโครงงาน (เก็บถาวร)',
        description_template: 'ปิดโครงงานหลังรับทราบผลแล้ว เพื่อเตรียมการยื่นรอบถัดไปหรือเก็บประวัติ',
        created_at: now,
        updated_at: now
      }
    ];

    await queryInterface.bulkInsert('workflow_step_definitions', projectSteps, {});
  },

  async down (queryInterface) {
    await queryInterface.bulkDelete('workflow_step_definitions', {
      workflow_type: 'project1',
      step_key: {
        [Op.in]: [
          'PROJECT1_ELIGIBILITY_CONFIRMED',
          'PROJECT1_DRAFT_CREATED',
          'PROJECT1_TEAM_CONFIRMED',
          'PROJECT1_ADVISOR_CONFIRMED',
          'PROJECT1_IN_PROGRESS',
          'PROJECT1_TOPIC_EXAM_RESULT',
          'PROJECT1_ARCHIVED'
        ]
      }
    }, {});
  }
};
