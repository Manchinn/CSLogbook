'use strict';

const NEW_STEP_DEFINITIONS = [
  {
    step_key: 'PROJECT1_TEAM_READY',
    step_order: 1,
    title: 'ส่งหัวข้อโครงงานพิเศษ',
    description_template: 'เตรียมทีมให้ครบ 2 คน กรอกชื่อหัวข้อ (TH/EN) และข้อมูลพื้นฐานเพื่อส่งหัวข้อเข้ารับการสอบ'
  },
  {
    step_key: 'PROJECT1_IN_PROGRESS',
    step_order: 2,
    title: 'เปิดดำเนินโครงงาน',
    description_template: 'เปิดใช้งานโครงงานสู่สถานะ in progress และเริ่มดำเนินงานตามแผนที่วางไว้'
  },
  {
    step_key: 'PROJECT1_PROGRESS_CHECKINS',
    step_order: 3,
    title: 'บันทึกความคืบหน้ากับอาจารย์',
    description_template: 'จัดการพบอาจารย์และบันทึก log ที่ได้รับการอนุมัติ เพื่อยืนยันความคืบหน้าโครงงาน'
  },
  {
    step_key: 'PROJECT1_READINESS_REVIEW',
    step_order: 4,
    title: 'ตรวจความพร้อมยื่นสอบโครงงานพิเศษ 1',
    description_template: 'ตรวจสอบเงื่อนไขความพร้อมก่อนยื่นสอบ เช่น การพบอาจารย์ที่ได้รับอนุมัติครบตามเกณฑ์'
  },
  {
    step_key: 'PROJECT1_DEFENSE_RESULT',
    step_order: 5,
    title: 'ผลการสอบหัวข้อโครงงาน',
    description_template: 'สรุปผลการสอบหัวข้อโครงงานและดำเนินการตามผล (ผ่าน / ไม่ผ่าน / รับทราบผล)'
  }
];

const OLD_STEP_DEFINITIONS = [
  {
    step_key: 'PROJECT1_ELIGIBILITY_CONFIRMED',
    step_order: 1,
    title: 'ผ่านเกณฑ์โครงงานพิเศษ',
    description_template: 'ยืนยันว่านักศึกษาผ่านเกณฑ์โครงงานพิเศษตามหน่วยกิตขั้นต่ำของหลักสูตร'
  },
  {
    step_key: 'PROJECT1_DRAFT_CREATED',
    step_order: 2,
    title: 'สร้างร่างหัวข้อโครงงาน',
    description_template: 'นักศึกษาเริ่มต้นร่างหัวข้อโครงงานและจัดเตรียมรายละเอียดเบื้องต้น'
  },
  {
    step_key: 'PROJECT1_TEAM_CONFIRMED',
    step_order: 3,
    title: 'ยืนยันสมาชิกทีมโครงงาน',
    description_template: 'ตรวจสอบให้ทีมโครงงานมีสมาชิกครบตามเกณฑ์และพร้อมทำงานร่วมกัน'
  },
  {
    step_key: 'PROJECT1_ADVISOR_CONFIRMED',
    step_order: 4,
    title: 'เลือกอาจารย์ที่ปรึกษา',
    description_template: 'ระบุอาจารย์ที่ปรึกษา (และอาจารย์ร่วม) เพื่อรับผิดชอบโครงงาน'
  },
  {
    step_key: 'PROJECT1_IN_PROGRESS',
    step_order: 5,
    title: 'เริ่มดำเนินโครงงาน',
    description_template: 'โครงงานถูกเปิดใช้งานอย่างเป็นทางการและกำลังอยู่ในระหว่างดำเนินการ'
  },
  {
    step_key: 'PROJECT1_TOPIC_EXAM_RESULT',
    step_order: 6,
    title: 'สรุปผลการสอบหัวข้อ',
    description_template: 'บันทึกผลการสอบหัวข้อโครงงาน (ผ่านหรือไม่ผ่าน)'
  },
  {
    step_key: 'PROJECT1_ARCHIVED',
    step_order: 7,
    title: 'ปิดโครงงาน (เก็บถาวร)',
    description_template: 'ปิดโครงงานหลังรับทราบผลแล้ว เพื่อเตรียมการยื่นรอบถัดไปหรือเก็บประวัติ'
  }
];

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkDelete('workflow_step_definitions', {
      workflow_type: 'project1'
    }, {});

    const rows = NEW_STEP_DEFINITIONS.map(step => ({
      workflow_type: 'project1',
      step_key: step.step_key,
      step_order: step.step_order,
      title: step.title,
      description_template: step.description_template,
      created_at: now,
      updated_at: now
    }));

    await queryInterface.bulkInsert('workflow_step_definitions', rows, {});
  },

  async down(queryInterface) {
    const now = new Date();

    await queryInterface.bulkDelete('workflow_step_definitions', {
      workflow_type: 'project1'
    }, {});

    const rows = OLD_STEP_DEFINITIONS.map(step => ({
      workflow_type: 'project1',
      step_key: step.step_key,
      step_order: step.step_order,
      title: step.title,
      description_template: step.description_template,
      created_at: now,
      updated_at: now
    }));

    await queryInterface.bulkInsert('workflow_step_definitions', rows, {});
  }
};
