'use strict';
const { Op } = require('sequelize');

/**
 * Seeder: Add Late Submission and Overdue States
 * 
 * Adds new workflow states to support automated deadline management:
 * - PENDING_LATE_SUBMISSION: Student can still submit but it's marked as late
 * - PENDING_LATE_APPROVAL: Staff needs to approve late submissions
 * - OVERDUE: Hard deadline passed, submission locked
 * 
 * Applies to Project 1 and Project 2 at 3 key phases:
 * 1. Proposal Submission
 * 2. Defense Request
 * 3. Final Document Submission
 */

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    
    const lateOverdueStates = [
      // ==================== PROJECT 1: PROPOSAL ====================
      {
        workflow_type: 'project1',
        step_key: 'PROJECT_PROPOSAL_PENDING_LATE_SUBMISSION',
        step_order: 11,
        title: 'รอนักศึกษาส่งข้อเสนอโครงงาน (ส่งสาย)',
        description_template: 'นักศึกษาส่งข้อเสนอโครงงานหลังกำหนดเวลา กรุณาระบุเหตุผลประกอบการส่ง',
        phase_key: 'proposal',
        phase_variant: 'late',
        created_at: now,
        updated_at: now
      },
      {
        workflow_type: 'project1',
        step_key: 'PROJECT_PROPOSAL_PENDING_LATE_APPROVAL',
        step_order: 12,
        title: 'รอเจ้าหน้าที่พิจารณาข้อเสนอโครงงาน (ส่งสาย)',
        description_template: 'ข้อเสนอโครงงานถูกส่งหลังกำหนดเวลา รอเจ้าหน้าที่ตรวจสอบและอนุมัติ',
        phase_key: 'proposal',
        phase_variant: 'late',
        created_at: now,
        updated_at: now
      },
      {
        workflow_type: 'project1',
        step_key: 'PROJECT_PROPOSAL_OVERDUE',
        step_order: 13,
        title: 'หมดเขตส่งข้อเสนอโครงงาน',
        description_template: 'กำหนดเวลาส่งข้อเสนอโครงงานสิ้นสุดแล้ว ไม่สามารถส่งงานได้อีกต่อไป',
        phase_key: 'proposal',
        phase_variant: 'overdue',
        created_at: now,
        updated_at: now
      },

      // ==================== PROJECT 1: DEFENSE REQUEST ====================
      {
        workflow_type: 'project1',
        step_key: 'PROJECT_DEFENSE_PENDING_LATE_SUBMISSION',
        step_order: 51,
        title: 'รอนักศึกษายื่นขอสอบโครงงาน (ส่งสาย)',
        description_template: 'นักศึกษายื่นคำร้องขอสอบหลังกำหนดเวลา กรุณาระบุเหตุผลประกอบ',
        phase_key: 'defense',
        phase_variant: 'late',
        created_at: now,
        updated_at: now
      },
      {
        workflow_type: 'project1',
        step_key: 'PROJECT_DEFENSE_PENDING_LATE_APPROVAL',
        step_order: 52,
        title: 'รอเจ้าหน้าที่พิจารณาคำร้องขอสอบ (ส่งสาย)',
        description_template: 'คำร้องขอสอบถูกยื่นหลังกำหนดเวลา รอเจ้าหน้าที่ตรวจสอบและอนุมัติ',
        phase_key: 'defense',
        phase_variant: 'late',
        created_at: now,
        updated_at: now
      },
      {
        workflow_type: 'project1',
        step_key: 'PROJECT_DEFENSE_OVERDUE',
        step_order: 53,
        title: 'หมดเขตยื่นขอสอบโครงงาน',
        description_template: 'กำหนดเวลายื่นขอสอบสิ้นสุดแล้ว ไม่สามารถยื่นคำร้องได้อีกต่อไป',
        phase_key: 'defense',
        phase_variant: 'overdue',
        created_at: now,
        updated_at: now
      },

      // ==================== PROJECT 1: FINAL DOCUMENT ====================
      {
        workflow_type: 'project1',
        step_key: 'PROJECT_FINAL_DOCUMENT_PENDING_LATE_SUBMISSION',
        step_order: 91,
        title: 'รอนักศึกษาส่งเล่มสมบูรณ์ (ส่งสาย)',
        description_template: 'นักศึกษาส่งเล่มสมบูรณ์หลังกำหนดเวลา กรุณาระบุเหตุผลประกอบการส่ง',
        phase_key: 'final_document',
        phase_variant: 'late',
        created_at: now,
        updated_at: now
      },
      {
        workflow_type: 'project1',
        step_key: 'PROJECT_FINAL_DOCUMENT_PENDING_LATE_APPROVAL',
        step_order: 92,
        title: 'รอเจ้าหน้าที่พิจารณาเล่มสมบูรณ์ (ส่งสาย)',
        description_template: 'เล่มสมบูรณ์ถูกส่งหลังกำหนดเวลา รอเจ้าหน้าที่ตรวจสอบและอนุมัติ',
        phase_key: 'final_document',
        phase_variant: 'late',
        created_at: now,
        updated_at: now
      },
      {
        workflow_type: 'project1',
        step_key: 'PROJECT_FINAL_DOCUMENT_OVERDUE',
        step_order: 93,
        title: 'หมดเขตส่งเล่มสมบูรณ์',
        description_template: 'กำหนดเวลาส่งเล่มสมบูรณ์สิ้นสุดแล้ว ไม่สามารถส่งงานได้อีกต่อไป',
        phase_key: 'final_document',
        phase_variant: 'overdue',
        created_at: now,
        updated_at: now
      },

      // ==================== PROJECT 2: THESIS PROPOSAL ====================
      {
        workflow_type: 'project2',
        step_key: 'THESIS_PROPOSAL_PENDING_LATE_SUBMISSION',
        step_order: 11,
        title: 'รอนักศึกษาส่งข้อเสนอปริญญานิพนธ์ (ส่งสาย)',
        description_template: 'นักศึกษาส่งข้อเสนอปริญญานิพนธ์หลังกำหนดเวลา กรุณาระบุเหตุผลประกอบ',
        phase_key: 'proposal',
        phase_variant: 'late',
        created_at: now,
        updated_at: now
      },
      {
        workflow_type: 'project2',
        step_key: 'THESIS_PROPOSAL_PENDING_LATE_APPROVAL',
        step_order: 12,
        title: 'รอเจ้าหน้าที่พิจารณาข้อเสนอปริญญานิพนธ์ (ส่งสาย)',
        description_template: 'ข้อเสนอปริญญานิพนธ์ถูกส่งหลังกำหนดเวลา รอเจ้าหน้าที่ตรวจสอบ',
        phase_key: 'proposal',
        phase_variant: 'late',
        created_at: now,
        updated_at: now
      },
      {
        workflow_type: 'project2',
        step_key: 'THESIS_PROPOSAL_OVERDUE',
        step_order: 13,
        title: 'หมดเขตส่งข้อเสนอปริญญานิพนธ์',
        description_template: 'กำหนดเวลาส่งข้อเสนอปริญญานิพนธ์สิ้นสุดแล้ว',
        phase_key: 'proposal',
        phase_variant: 'overdue',
        created_at: now,
        updated_at: now
      },

      // ==================== PROJECT 2: THESIS DEFENSE ====================
      {
        workflow_type: 'project2',
        step_key: 'THESIS_DEFENSE_PENDING_LATE_SUBMISSION',
        step_order: 51,
        title: 'รอนักศึกษายื่นขอสอบปริญญานิพนธ์ (ส่งสาย)',
        description_template: 'นักศึกษายื่นคำร้องขอสอบปริญญานิพนธ์หลังกำหนดเวลา',
        phase_key: 'defense',
        phase_variant: 'late',
        created_at: now,
        updated_at: now
      },
      {
        workflow_type: 'project2',
        step_key: 'THESIS_DEFENSE_PENDING_LATE_APPROVAL',
        step_order: 52,
        title: 'รอเจ้าหน้าที่พิจารณาคำร้องขอสอบ (ส่งสาย)',
        description_template: 'คำร้องขอสอบปริญญานิพนธ์ถูกยื่นหลังกำหนดเวลา',
        phase_key: 'defense',
        phase_variant: 'late',
        created_at: now,
        updated_at: now
      },
      {
        workflow_type: 'project2',
        step_key: 'THESIS_DEFENSE_OVERDUE',
        step_order: 53,
        title: 'หมดเขตยื่นขอสอบปริญญานิพนธ์',
        description_template: 'กำหนดเวลายื่นขอสอบปริญญานิพนธ์สิ้นสุดแล้ว',
        phase_key: 'defense',
        phase_variant: 'overdue',
        created_at: now,
        updated_at: now
      },

      // ==================== PROJECT 2: FINAL THESIS ====================
      {
        workflow_type: 'project2',
        step_key: 'THESIS_FINAL_DOCUMENT_PENDING_LATE_SUBMISSION',
        step_order: 91,
        title: 'รอนักศึกษาส่งเล่มปริญญานิพนธ์สมบูรณ์ (ส่งสาย)',
        description_template: 'นักศึกษาส่งเล่มปริญญานิพนธ์หลังกำหนดเวลา',
        phase_key: 'final_document',
        phase_variant: 'late',
        created_at: now,
        updated_at: now
      },
      {
        workflow_type: 'project2',
        step_key: 'THESIS_FINAL_DOCUMENT_PENDING_LATE_APPROVAL',
        step_order: 92,
        title: 'รอเจ้าหน้าที่พิจารณาเล่มปริญญานิพนธ์ (ส่งสาย)',
        description_template: 'เล่มปริญญานิพนธ์ถูกส่งหลังกำหนดเวลา',
        phase_key: 'final_document',
        phase_variant: 'late',
        created_at: now,
        updated_at: now
      },
      {
        workflow_type: 'project2',
        step_key: 'THESIS_FINAL_DOCUMENT_OVERDUE',
        step_order: 93,
        title: 'หมดเขตส่งเล่มปริญญานิพนธ์สมบูรณ์',
        description_template: 'กำหนดเวลาส่งเล่มปริญญานิพนธ์สิ้นสุดแล้ว',
        phase_key: 'final_document',
        phase_variant: 'overdue',
        created_at: now,
        updated_at: now
      }
    ];

    await queryInterface.bulkInsert('workflow_step_definitions', lateOverdueStates, {});
    
    console.log(`✅ Added ${lateOverdueStates.length} late/overdue workflow states`);
  },

  async down(queryInterface) {
    // Remove all late and overdue states
    await queryInterface.bulkDelete('workflow_step_definitions', {
      [Op.or]: [
        { phase_variant: 'late' },
        { phase_variant: 'overdue' }
      ]
    }, {});
    
    console.log('✅ Removed all late/overdue workflow states');
  }
};
