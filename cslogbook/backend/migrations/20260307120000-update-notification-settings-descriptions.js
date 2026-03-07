'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const descriptions = [
      { type: 'LOGIN', description: 'แจ้งเตือนทางอีเมลเมื่อมีการเข้าสู่ระบบ' },
      { type: 'DOCUMENT', description: 'แจ้งเตือนผลเอกสาร กำหนดส่ง และเอกสารค้างตรวจ' },
      { type: 'LOGBOOK', description: 'แจ้งเตือนการส่งและคุณภาพบันทึกประจำวัน' },
      { type: 'EVALUATION', description: 'แจ้งเตือนการประเมินผลการฝึกงาน' },
      { type: 'APPROVAL', description: 'แจ้งเตือนคำขออนุมัติบันทึกการฝึกงาน' },
      { type: 'MEETING', description: 'แจ้งเตือนการนัดหมายพบอาจารย์โครงงาน' },
    ];

    for (const { type, description } of descriptions) {
      await queryInterface.sequelize.query(
        `UPDATE notification_settings SET description = ? WHERE notification_type = ?`,
        { replacements: [description, type] }
      );
    }
  },

  async down(queryInterface) {
    const oldDescriptions = [
      { type: 'LOGIN', description: 'แจ้งเตือนเมื่อมีการเข้าสู่ระบบ' },
      { type: 'DOCUMENT', description: 'แจ้งเตือนเมื่อมีการอัปเดตเอกสาร' },
      { type: 'LOGBOOK', description: 'แจ้งเตือนเมื่อมีการอัปเดต logbook' },
      { type: 'EVALUATION', description: 'แจ้งเตือนเมื่อมีการประเมิน' },
      { type: 'APPROVAL', description: 'แจ้งเตือนเมื่อมีการอนุมัติ' },
      { type: 'MEETING', description: 'การแจ้งเตือนเมื่อมีการขออนุมัติบันทึกการพบอาจารย์' },
    ];

    for (const { type, description } of oldDescriptions) {
      await queryInterface.sequelize.query(
        `UPDATE notification_settings SET description = ? WHERE notification_type = ?`,
        { replacements: [description, type] }
      );
    }
  },
};
