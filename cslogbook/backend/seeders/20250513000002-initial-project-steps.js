'use strict';
const { Op } = require('sequelize');

module.exports = {
  async up (queryInterface) {
    const now = new Date();
    const projectSteps = [
      {
        workflow_type: 'project1',
        step_key: 'PROJECT1_TEAM_READY',
        step_order: 1,
        title: 'ส่งหัวข้อโครงงานพิเศษ',
        description_template: 'เตรียมทีมให้ครบ 2 คน กรอกชื่อหัวข้อ (TH/EN) และข้อมูลพื้นฐานเพื่อส่งหัวข้อเข้ารับการสอบ',
        created_at: now,
        updated_at: now
      },
      {
        workflow_type: 'project1',
        step_key: 'PROJECT1_IN_PROGRESS',
        step_order: 2,
        title: 'เปิดดำเนินโครงงาน',
        description_template: 'เปิดใช้งานโครงงานสู่สถานะ in progress และเริ่มดำเนินงานตามแผนที่วางไว้',
        created_at: now,
        updated_at: now
      },
      {
        workflow_type: 'project1',
        step_key: 'PROJECT1_PROGRESS_CHECKINS',
        step_order: 3,
        title: 'บันทึกความคืบหน้ากับอาจารย์',
        description_template: 'จัดการพบอาจารย์และบันทึก log ที่ได้รับการอนุมัติ เพื่อยืนยันความคืบหน้าโครงงาน',
        created_at: now,
        updated_at: now
      },
      {
        workflow_type: 'project1',
        step_key: 'PROJECT1_READINESS_REVIEW',
        step_order: 4,
        title: 'ตรวจความพร้อมยื่นสอบโครงงานพิเศษ 1',
        description_template: 'ตรวจสอบเงื่อนไขความพร้อมก่อนยื่นสอบ เช่น การพบอาจารย์ที่ได้รับอนุมัติครบตามเกณฑ์',
        created_at: now,
        updated_at: now
      },
      {
        workflow_type: 'project1',
        step_key: 'PROJECT1_DEFENSE_RESULT',
        step_order: 5,
        title: 'ผลการสอบหัวข้อโครงงาน',
        description_template: 'สรุปผลการสอบหัวข้อโครงงานและดำเนินการตามผล (ผ่าน / ไม่ผ่าน / รับทราบผล)',
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
          'PROJECT1_TEAM_READY',
          'PROJECT1_IN_PROGRESS',
          'PROJECT1_PROGRESS_CHECKINS',
          'PROJECT1_READINESS_REVIEW',
          'PROJECT1_DEFENSE_RESULT'
        ]
      }
    }, {});
  }
};
