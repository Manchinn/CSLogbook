'use strict';

/**
 * Migration: Insert missing internship workflow steps on environments where
 * the seeder `20251122000003-restore-internship-steps.js` never ran (prod CI
 * runs migrations only).
 *
 * Symptom: workflow_step_definitions contains a single row
 * (INTERNSHIP_CS05_APPROVAL_PENDING inserted by migration 20260318063302),
 * which breaks the timeline for every student — current step cannot be
 * located in the step dictionary, so CurrentStepIndex = -1 and the UI hides
 * panels that depend on the workflow.
 *
 * Idempotent: inserts only step_keys that do not already exist. Safe to run
 * on environments that already seeded the full set.
 *
 * Final layout (10 steps, matches migration 20260318063302):
 *   1  INTERNSHIP_ELIGIBILITY_MET
 *   2  INTERNSHIP_CS05_SUBMITTED
 *   3  INTERNSHIP_CS05_APPROVAL_PENDING   ← already present from prior migration
 *   4  INTERNSHIP_CS05_APPROVED
 *   5  INTERNSHIP_COMPANY_RESPONSE_PENDING
 *   6  INTERNSHIP_COMPANY_RESPONSE_RECEIVED
 *   7  INTERNSHIP_AWAITING_START
 *   8  INTERNSHIP_IN_PROGRESS
 *   9  INTERNSHIP_SUMMARY_PENDING
 *  10  INTERNSHIP_COMPLETED
 */

const STEPS = [
  {
    step_key: 'INTERNSHIP_ELIGIBILITY_MET',
    step_order: 1,
    title: 'มีสิทธิ์ลงทะเบียนฝึกงาน',
    description_template: 'คุณมีคุณสมบัติครบถ้วนในการลงทะเบียนฝึกงาน',
  },
  {
    step_key: 'INTERNSHIP_CS05_SUBMITTED',
    step_order: 2,
    title: 'ยื่นคำร้องฝึกงาน (คพ.05)',
    description_template: 'นักศึกษาได้ยื่นเอกสาร คพ.05 เพื่อขออนุมัติการฝึกงานแล้ว',
  },
  {
    step_key: 'INTERNSHIP_CS05_APPROVED',
    step_order: 4,
    title: 'คพ.05 ได้รับการอนุมัติ',
    description_template: 'คำร้อง คพ.05 ของคุณได้รับการอนุมัติแล้ว โปรดดำเนินการขั้นตอนต่อไป',
  },
  {
    step_key: 'INTERNSHIP_COMPANY_RESPONSE_PENDING',
    step_order: 5,
    title: 'รอหนังสือตอบรับจากสถานประกอบการ',
    description_template: 'โปรดติดต่อสถานประกอบการและอัปโหลดหนังสือตอบรับ',
  },
  {
    step_key: 'INTERNSHIP_COMPANY_RESPONSE_RECEIVED',
    step_order: 6,
    title: 'ได้รับหนังสือตอบรับแล้ว',
    description_template: 'ระบบได้รับหนังสือตอบรับจากสถานประกอบการของคุณแล้ว',
  },
  {
    step_key: 'INTERNSHIP_AWAITING_START',
    step_order: 7,
    title: 'รอเริ่มการฝึกงาน',
    description_template: 'เตรียมตัวเริ่มการฝึกงานตามกำหนดการ',
  },
  {
    step_key: 'INTERNSHIP_IN_PROGRESS',
    step_order: 8,
    title: 'อยู่ระหว่างการฝึกงาน',
    description_template: 'กำลังดำเนินการฝึกงาน บันทึกการปฏิบัติงานประจำวัน',
  },
  {
    step_key: 'INTERNSHIP_SUMMARY_PENDING',
    step_order: 9,
    title: 'รอส่งเอกสารสรุปผลการฝึกงาน',
    description_template: 'เมื่อสิ้นสุดการฝึกงาน โปรดส่งเอกสารสรุปผลและรายงาน',
  },
  {
    step_key: 'INTERNSHIP_COMPLETED',
    step_order: 10,
    title: 'การฝึกงานเสร็จสมบูรณ์',
    description_template: 'กระบวนการฝึกงานทั้งหมดของคุณเสร็จสิ้นแล้ว',
  },
];

module.exports = {
  async up(queryInterface) {
    const [existing] = await queryInterface.sequelize.query(
      `SELECT step_key FROM workflow_step_definitions WHERE workflow_type = 'internship'`
    );
    const have = new Set(existing.map((r) => r.step_key));
    const missing = STEPS.filter((s) => !have.has(s.step_key));

    if (missing.length === 0) {
      console.log('ℹ️ internship workflow steps: all present, skipping');
      return;
    }

    const now = new Date();
    await queryInterface.bulkInsert(
      'workflow_step_definitions',
      missing.map((s) => ({
        workflow_type: 'internship',
        step_key: s.step_key,
        step_order: s.step_order,
        title: s.title,
        description_template: s.description_template,
        phase_variant: 'default',
        created_at: now,
        updated_at: now,
      }))
    );
    console.log(`✅ Inserted ${missing.length} missing internship workflow steps`);
  },

  async down() {
    // No-op: do not delete steps on rollback — removing them would break any
    // StudentWorkflowActivity row that references them. The previous
    // migration (20260318063302) already guarantees CS05_APPROVAL_PENDING
    // exists on its own.
  },
};
