'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkUpdate(
      'workflow_step_definitions',
      {
        title: 'ส่งหัวข้อโครงงานพิเศษ',
        description_template: 'เตรียมทีมให้ครบ 2 คน กรอกชื่อหัวข้อ (TH/EN) และข้อมูลพื้นฐานเพื่อส่งหัวข้อเข้ารับการสอบ',
        updated_at: now
      },
      {
        workflow_type: 'project1',
        step_key: 'PROJECT1_TEAM_READY'
      }
    );
  },

  async down(queryInterface) {
    const now = new Date();
    await queryInterface.bulkUpdate(
      'workflow_step_definitions',
      {
        title: 'จัดตั้งทีมและอาจารย์ที่ปรึกษา',
        description_template: 'ตั้งค่าทีมโครงงานให้ครบ 2 คนและเลือกอาจารย์ที่ปรึกษาเพื่อเริ่มต้นอย่างถูกต้อง',
        updated_at: now
      },
      {
        workflow_type: 'project1',
        step_key: 'PROJECT1_TEAM_READY'
      }
    );
  }
};
