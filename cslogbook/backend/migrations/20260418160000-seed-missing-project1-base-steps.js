'use strict';

/**
 * Migration: Seed missing project1 base (default-variant) workflow steps.
 *
 * On 2026-04-18 the VPS workflow_step_definitions table showed 0 project1
 * default-variant rows — only the 9 late/overdue rows inserted earlier the
 * same day by 20260418150000-seed-missing-project-workflow-data.js.
 *
 * Root cause: migration 20251001090000-update-project1-workflow-steps.js
 * was authored as "bulkDelete + insert 5 rows", assuming seeder
 * 20250513000002-initial-project-steps.js had already populated the table.
 * On prod the seeder never ran (docker-entrypoint.sh runs migrate:prod
 * only). Today's migration 20260418150000 assumed those rows existed and
 * only did an UPDATE-on-NULL for phase_key — a no-op when there are no
 * rows to update. Result: project1 has only late/overdue rows, no default
 * rows.
 *
 * Covers 7 base step_keys (step_order 1..7) with phase_key / phase_variant
 * matching seeders 20250930121000-update-project1-workflow-steps.js and
 * 20251108091500-seed-project-workflow-phase-mappings.js.
 *
 * Idempotent: insert skips existing step_keys. UPDATE only sets phase_key
 * on rows where it is NULL. Safe to re-run.
 *
 * down() is a no-op — StudentWorkflowActivity / ProjectWorkflowState may
 * already reference these rows once students start the project1 track.
 */

const PROJECT1_BASE_STEPS = [
  {
    step_key: 'PROJECT1_TEAM_READY',
    step_order: 1,
    title: 'ส่งหัวข้อโครงงานพิเศษ',
    description_template:
      'เตรียมทีมให้ครบ 2 คน กรอกชื่อหัวข้อ (TH/EN) และข้อมูลพื้นฐานเพื่อส่งหัวข้อเข้ารับการสอบ',
    phase_key: null,
    phase_variant: 'default',
  },
  {
    step_key: 'PROJECT1_IN_PROGRESS',
    step_order: 2,
    title: 'เปิดดำเนินโครงงาน',
    description_template:
      'เปิดใช้งานโครงงานสู่สถานะ in progress และเริ่มดำเนินงานตามแผนที่วางไว้',
    phase_key: 'IN_PROGRESS',
    phase_variant: 'default',
  },
  {
    step_key: 'PROJECT1_PROGRESS_CHECKINS',
    step_order: 3,
    title: 'บันทึกความคืบหน้ากับอาจารย์',
    description_template:
      'จัดการพบอาจารย์และบันทึก log ที่ได้รับการอนุมัติ เพื่อยืนยันความคืบหน้าโครงงาน',
    phase_key: null,
    phase_variant: 'default',
  },
  {
    step_key: 'PROJECT1_READINESS_REVIEW',
    step_order: 4,
    title: 'ตรวจความพร้อมยื่นสอบโครงงานพิเศษ 1',
    description_template:
      'ตรวจสอบเงื่อนไขความพร้อมก่อนยื่นสอบ เช่น การพบอาจารย์ที่ได้รับอนุมัติครบตามเกณฑ์',
    phase_key: null,
    phase_variant: 'default',
  },
  {
    step_key: 'PROJECT1_DEFENSE_REQUEST',
    step_order: 5,
    title: 'ยื่นคำขอสอบโครงงานพิเศษ 1',
    description_template:
      'ยื่นแบบฟอร์มคพ.02 พร้อมข้อมูลติดต่อสมาชิก และยืนยันความพร้อมสอบ',
    phase_key: 'TOPIC_EXAM_PENDING',
    phase_variant: 'default',
  },
  {
    step_key: 'PROJECT1_DEFENSE_SCHEDULED',
    step_order: 6,
    title: 'นัดสอบโครงงานพิเศษ 1',
    description_template:
      'เจ้าหน้าที่กำหนดวัน เวลา และสถานที่สอบ พร้อมแจ้งทีมโครงงานและคณะกรรมการ',
    phase_key: 'TOPIC_EXAM_SCHEDULED',
    phase_variant: 'default',
  },
  {
    step_key: 'PROJECT1_DEFENSE_RESULT',
    step_order: 7,
    title: 'ผลการสอบหัวข้อโครงงาน',
    description_template:
      'สรุปผลการสอบหัวข้อโครงงานและดำเนินการตามผล (ผ่าน / ไม่ผ่าน / รับทราบผล)',
    phase_key: 'COMPLETED',
    phase_variant: 'default',
  },
];

async function fetchExistingProject1Keys(queryInterface) {
  const [rows] = await queryInterface.sequelize.query(
    `SELECT step_key FROM workflow_step_definitions WHERE workflow_type = 'project1'`
  );
  return new Set(rows.map((r) => r.step_key));
}

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    // 1) Insert missing project1 base step rows
    const existing = await fetchExistingProject1Keys(queryInterface);
    const missing = PROJECT1_BASE_STEPS.filter((s) => !existing.has(s.step_key));

    if (missing.length > 0) {
      await queryInterface.bulkInsert(
        'workflow_step_definitions',
        missing.map((s) => ({
          workflow_type: 'project1',
          step_key: s.step_key,
          step_order: s.step_order,
          title: s.title,
          description_template: s.description_template,
          phase_key: s.phase_key,
          phase_variant: s.phase_variant,
          created_at: now,
          updated_at: now,
        }))
      );
      console.log(`✅ Inserted ${missing.length} project1 base workflow steps`);
    } else {
      console.log('ℹ️ project1 base workflow steps already present');
    }

    // 2) Fill in phase_key for any existing rows where it's still NULL
    //    (covers the case where today's earlier migration inserted late/overdue
    //     but left default rows without phase_key).
    for (const step of PROJECT1_BASE_STEPS) {
      if (step.phase_key === null) continue;
      await queryInterface.sequelize.query(
        `UPDATE workflow_step_definitions
            SET phase_key = :phase_key, phase_variant = 'default', updated_at = NOW()
          WHERE workflow_type = 'project1'
            AND step_key = :step_key
            AND phase_key IS NULL`,
        { replacements: { step_key: step.step_key, phase_key: step.phase_key } }
      );
    }
  },

  async down() {
    // No-op: removing these rows would break StudentWorkflowActivity /
    // ProjectWorkflowState references if any project1 students have begun.
  },
};
