'use strict';

const { Op } = require('sequelize');

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkUpdate(
      'workflow_step_definitions',
      {
        step_order: 7,
        title: 'ผลการสอบหัวข้อโครงงาน',
        description_template: 'สรุปผลการสอบหัวข้อโครงงานและดำเนินการตามผล (ผ่าน / ไม่ผ่าน / รับทราบผล)',
        updated_at: now
      },
      {
        workflow_type: 'project1',
        step_key: 'PROJECT1_DEFENSE_RESULT'
      }
    );

    const newSteps = [
      {
        workflow_type: 'project1',
        step_key: 'PROJECT1_DEFENSE_REQUEST',
        step_order: 5,
        title: 'ยื่นคำขอสอบโครงงานพิเศษ 1',
        description_template: 'ยื่นแบบฟอร์มคพ.02 พร้อมข้อมูลติดต่อสมาชิก และยืนยันความพร้อมสอบ',
        created_at: now,
        updated_at: now
      },
      {
        workflow_type: 'project1',
        step_key: 'PROJECT1_DEFENSE_SCHEDULED',
        step_order: 6,
        title: 'นัดสอบโครงงานพิเศษ 1',
        description_template: 'เจ้าหน้าที่กำหนดวัน เวลา และสถานที่สอบ พร้อมแจ้งทีมโครงงานและคณะกรรมการ',
        created_at: now,
        updated_at: now
      }
    ];

    try {
      await queryInterface.bulkInsert('workflow_step_definitions', newSteps, {
        updateOnDuplicate: ['title', 'description_template', 'step_order', 'updated_at']
      });
    } catch (error) {
      if (!/Duplicate entry|unique constraint/i.test(error.message)) {
        throw error;
      }
      await Promise.all(
        newSteps.map((step) =>
          queryInterface.bulkUpdate(
            'workflow_step_definitions',
            {
              title: step.title,
              description_template: step.description_template,
              step_order: step.step_order,
              updated_at: now
            },
            {
              workflow_type: 'project1',
              step_key: step.step_key
            }
          )
        )
      );
    }
  },

  async down(queryInterface) {
    const now = new Date();

    await queryInterface.bulkDelete(
      'workflow_step_definitions',
      {
        workflow_type: 'project1',
        step_key: {
          [Op.in]: ['PROJECT1_DEFENSE_REQUEST', 'PROJECT1_DEFENSE_SCHEDULED']
        }
      }
    );

    await queryInterface.bulkUpdate(
      'workflow_step_definitions',
      {
        step_order: 5,
        updated_at: now
      },
      {
        workflow_type: 'project1',
        step_key: 'PROJECT1_DEFENSE_RESULT'
      }
    );
  }
};
