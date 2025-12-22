'use strict';
const { Op } = require('sequelize');

module.exports = {
  async up (queryInterface, Sequelize) {
    const now = new Date();
    const project2Steps = [
      {
        workflow_type: 'project2',
        step_key: 'THESIS_PROPOSAL_SUBMITTED',
        step_order: 1,
        title: 'ยื่นหัวข้อปริญญานิพนธ์',
        description_template: 'ส่งหัวข้อปริญญานิพนธ์และรอการอนุมัติจากอาจารย์ที่ปรึกษา',
        created_at: now,
        updated_at: now
      },
      {
        workflow_type: 'project2',
        step_key: 'THESIS_IN_PROGRESS',
        step_order: 2,
        title: 'ดำเนินโครงงาน/ปริญญานิพนธ์',
        description_template: 'เริ่มดำเนินการทำปริญญานิพนธ์ตามแผนงาน',
        created_at: now,
        updated_at: now
      },
      {
        workflow_type: 'project2',
        step_key: 'THESIS_PROGRESS_CHECKINS',
        step_order: 3,
        title: 'บันทึกความคืบหน้า',
        description_template: 'พบอาจารย์ที่ปรึกษาและบันทึกความคืบหน้าอย่างสม่ำเสมอ',
        created_at: now,
        updated_at: now
      },
      {
        workflow_type: 'project2',
        step_key: 'THESIS_SYSTEM_TEST',
        step_order: 4,
        title: 'ทดสอบระบบ',
        description_template: 'ดำเนินการทดสอบระบบและส่งผลการทดสอบ',
        created_at: now,
        updated_at: now
      },
      {
        workflow_type: 'project2',
        step_key: 'THESIS_DEFENSE_REQUEST',
        step_order: 5,
        title: 'ยื่นขอสอบปริญญานิพนธ์',
        description_template: 'ยื่นคำร้องขอสอบปริญญานิพนธ์ (คพ.03) เมื่อมีความพร้อม',
        created_at: now,
        updated_at: now
      },
      {
        workflow_type: 'project2',
        step_key: 'THESIS_DEFENSE_RESULT',
        step_order: 6,
        title: 'ผลการสอบปริญญานิพนธ์',
        description_template: 'รอผลการสอบปริญญานิพนธ์จากคณะกรรมการ',
        created_at: now,
        updated_at: now
      },
      {
        workflow_type: 'project2',
        step_key: 'THESIS_FINAL_SUBMISSION',
        step_order: 7,
        title: 'ส่งเล่มสมบูรณ์',
        description_template: 'ส่งเล่มปริญญานิพนธ์ฉบับสมบูรณ์เพื่อจบการศึกษา',
        created_at: now,
        updated_at: now
      }
    ];

    // Check existing steps to avoid duplicates
    const existingSteps = await queryInterface.sequelize.query(
      `SELECT step_key FROM workflow_step_definitions WHERE workflow_type = 'project2'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    
    const existingKeys = new Set(existingSteps.map(s => s.step_key));
    const newSteps = project2Steps.filter(s => !existingKeys.has(s.step_key));

    if (newSteps.length > 0) {
      await queryInterface.bulkInsert('workflow_step_definitions', newSteps, {});
      console.log(`✅ Added ${newSteps.length} Project 2 steps`);
    } else {
      console.log('ℹ️ All Project 2 steps already exist');
    }
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('workflow_step_definitions', {
      workflow_type: 'project2',
      step_key: {
        [Op.in]: [
          'THESIS_PROPOSAL_SUBMITTED',
          'THESIS_IN_PROGRESS',
          'THESIS_PROGRESS_CHECKINS',
          'THESIS_SYSTEM_TEST',
          'THESIS_DEFENSE_REQUEST',
          'THESIS_DEFENSE_RESULT',
          'THESIS_FINAL_SUBMISSION'
        ]
      }
    }, {});
  }
};
