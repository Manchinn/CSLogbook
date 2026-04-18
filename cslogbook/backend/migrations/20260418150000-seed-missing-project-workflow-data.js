'use strict';

/**
 * Migration: Seed missing project workflow data + late/overdue phase variants
 * on environments where corresponding seeders never ran (prod CI runs
 * migrations only).
 *
 * Covers three gaps identified by database review on 2026-04-18:
 *
 *   1. project2 (thesis) base step definitions — 7 rows
 *      (seeder 20251122000004-add-project2-steps.js never ran on prod)
 *
 *   2. project1 phase_key mappings — 4 UPDATE rows
 *      (seeder 20251108091500-seed-project-workflow-phase-mappings.js
 *       never ran on prod, so project1 rows have phase_key = NULL and
 *       phase lookups fail)
 *
 *   3. late/overdue phase_variant step definitions — 18 rows
 *      (seeder 20251122000001-add-late-overdue-states.js never ran on
 *       prod, so deadline enforcement can't resolve late/overdue steps)
 *
 *   4. Bonus cleanup: delete notification_settings rows with empty
 *      notification_type (orphan from past enum coerce bug).
 *
 * Idempotent: every insert is guarded with an existence check, the UPDATE
 * only touches rows with phase_key IS NULL. Safe to re-run.
 *
 * down() is a no-op — removing these rows would break
 * StudentWorkflowActivity / ProjectWorkflowState references and strip
 * phase mappings from rows that may have other updates since then.
 */

const PROJECT2_BASE_STEPS = [
  { step_key: 'THESIS_PROPOSAL_SUBMITTED',    step_order: 1, title: 'ยื่นหัวข้อปริญญานิพนธ์',             description_template: 'ส่งหัวข้อปริญญานิพนธ์และรอการอนุมัติจากอาจารย์ที่ปรึกษา' },
  { step_key: 'THESIS_IN_PROGRESS',           step_order: 2, title: 'ดำเนินโครงงาน/ปริญญานิพนธ์',        description_template: 'เริ่มดำเนินการทำปริญญานิพนธ์ตามแผนงาน' },
  { step_key: 'THESIS_PROGRESS_CHECKINS',     step_order: 3, title: 'บันทึกความคืบหน้า',                 description_template: 'พบอาจารย์ที่ปรึกษาและบันทึกความคืบหน้าอย่างสม่ำเสมอ' },
  { step_key: 'THESIS_SYSTEM_TEST',           step_order: 4, title: 'ทดสอบระบบ',                         description_template: 'ดำเนินการทดสอบระบบและส่งผลการทดสอบ' },
  { step_key: 'THESIS_DEFENSE_REQUEST',       step_order: 5, title: 'ยื่นขอสอบปริญญานิพนธ์',             description_template: 'ยื่นคำร้องขอสอบปริญญานิพนธ์ (คพ.03) เมื่อมีความพร้อม' },
  { step_key: 'THESIS_DEFENSE_RESULT',        step_order: 6, title: 'ผลการสอบปริญญานิพนธ์',              description_template: 'รอผลการสอบปริญญานิพนธ์จากคณะกรรมการ' },
  { step_key: 'THESIS_FINAL_SUBMISSION',      step_order: 7, title: 'ส่งเล่มสมบูรณ์',                    description_template: 'ส่งเล่มปริญญานิพนธ์ฉบับสมบูรณ์เพื่อจบการศึกษา' },
];

const PROJECT1_PHASE_MAPPINGS = [
  { step_key: 'PROJECT1_IN_PROGRESS',        phase_key: 'IN_PROGRESS' },
  { step_key: 'PROJECT1_DEFENSE_REQUEST',    phase_key: 'TOPIC_EXAM_PENDING' },
  { step_key: 'PROJECT1_DEFENSE_SCHEDULED',  phase_key: 'TOPIC_EXAM_SCHEDULED' },
  { step_key: 'PROJECT1_DEFENSE_RESULT',     phase_key: 'COMPLETED' },
];

const LATE_OVERDUE_STEPS = [
  // project1 proposal
  { workflow_type: 'project1', step_key: 'PROJECT_PROPOSAL_PENDING_LATE_SUBMISSION', step_order: 11, title: 'รอนักศึกษาส่งข้อเสนอโครงงาน (ส่งสาย)',           description_template: 'นักศึกษาส่งข้อเสนอโครงงานหลังกำหนดเวลา กรุณาระบุเหตุผลประกอบการส่ง',              phase_key: 'proposal',       phase_variant: 'late' },
  { workflow_type: 'project1', step_key: 'PROJECT_PROPOSAL_PENDING_LATE_APPROVAL',   step_order: 12, title: 'รอเจ้าหน้าที่พิจารณาข้อเสนอโครงงาน (ส่งสาย)',  description_template: 'ข้อเสนอโครงงานถูกส่งหลังกำหนดเวลา รอเจ้าหน้าที่ตรวจสอบและอนุมัติ',              phase_key: 'proposal',       phase_variant: 'late' },
  { workflow_type: 'project1', step_key: 'PROJECT_PROPOSAL_OVERDUE',                 step_order: 13, title: 'หมดเขตส่งข้อเสนอโครงงาน',                       description_template: 'กำหนดเวลาส่งข้อเสนอโครงงานสิ้นสุดแล้ว ไม่สามารถส่งงานได้อีกต่อไป',               phase_key: 'proposal',       phase_variant: 'overdue' },
  // project1 defense
  { workflow_type: 'project1', step_key: 'PROJECT_DEFENSE_PENDING_LATE_SUBMISSION',  step_order: 51, title: 'รอนักศึกษายื่นขอสอบโครงงาน (ส่งสาย)',            description_template: 'นักศึกษายื่นคำร้องขอสอบหลังกำหนดเวลา กรุณาระบุเหตุผลประกอบ',                     phase_key: 'defense',        phase_variant: 'late' },
  { workflow_type: 'project1', step_key: 'PROJECT_DEFENSE_PENDING_LATE_APPROVAL',    step_order: 52, title: 'รอเจ้าหน้าที่พิจารณาคำร้องขอสอบ (ส่งสาย)',     description_template: 'คำร้องขอสอบถูกยื่นหลังกำหนดเวลา รอเจ้าหน้าที่ตรวจสอบและอนุมัติ',                phase_key: 'defense',        phase_variant: 'late' },
  { workflow_type: 'project1', step_key: 'PROJECT_DEFENSE_OVERDUE',                  step_order: 53, title: 'หมดเขตยื่นขอสอบโครงงาน',                         description_template: 'กำหนดเวลายื่นขอสอบสิ้นสุดแล้ว ไม่สามารถยื่นคำร้องได้อีกต่อไป',                   phase_key: 'defense',        phase_variant: 'overdue' },
  // project1 final document
  { workflow_type: 'project1', step_key: 'PROJECT_FINAL_DOCUMENT_PENDING_LATE_SUBMISSION', step_order: 91, title: 'รอนักศึกษาส่งเล่มสมบูรณ์ (ส่งสาย)',       description_template: 'นักศึกษาส่งเล่มสมบูรณ์หลังกำหนดเวลา กรุณาระบุเหตุผลประกอบการส่ง',              phase_key: 'final_document', phase_variant: 'late' },
  { workflow_type: 'project1', step_key: 'PROJECT_FINAL_DOCUMENT_PENDING_LATE_APPROVAL',   step_order: 92, title: 'รอเจ้าหน้าที่พิจารณาเล่มสมบูรณ์ (ส่งสาย)', description_template: 'เล่มสมบูรณ์ถูกส่งหลังกำหนดเวลา รอเจ้าหน้าที่ตรวจสอบและอนุมัติ',                phase_key: 'final_document', phase_variant: 'late' },
  { workflow_type: 'project1', step_key: 'PROJECT_FINAL_DOCUMENT_OVERDUE',                 step_order: 93, title: 'หมดเขตส่งเล่มสมบูรณ์',                     description_template: 'กำหนดเวลาส่งเล่มสมบูรณ์สิ้นสุดแล้ว ไม่สามารถส่งงานได้อีกต่อไป',                 phase_key: 'final_document', phase_variant: 'overdue' },
  // project2 proposal
  { workflow_type: 'project2', step_key: 'THESIS_PROPOSAL_PENDING_LATE_SUBMISSION',  step_order: 11, title: 'รอนักศึกษาส่งข้อเสนอปริญญานิพนธ์ (ส่งสาย)',   description_template: 'นักศึกษาส่งข้อเสนอปริญญานิพนธ์หลังกำหนดเวลา กรุณาระบุเหตุผลประกอบ',          phase_key: 'proposal',       phase_variant: 'late' },
  { workflow_type: 'project2', step_key: 'THESIS_PROPOSAL_PENDING_LATE_APPROVAL',    step_order: 12, title: 'รอเจ้าหน้าที่พิจารณาข้อเสนอปริญญานิพนธ์ (ส่งสาย)', description_template: 'ข้อเสนอปริญญานิพนธ์ถูกส่งหลังกำหนดเวลา รอเจ้าหน้าที่ตรวจสอบ',              phase_key: 'proposal',       phase_variant: 'late' },
  { workflow_type: 'project2', step_key: 'THESIS_PROPOSAL_OVERDUE',                  step_order: 13, title: 'หมดเขตส่งข้อเสนอปริญญานิพนธ์',                  description_template: 'กำหนดเวลาส่งข้อเสนอปริญญานิพนธ์สิ้นสุดแล้ว',                                   phase_key: 'proposal',       phase_variant: 'overdue' },
  // project2 defense
  { workflow_type: 'project2', step_key: 'THESIS_DEFENSE_PENDING_LATE_SUBMISSION',   step_order: 51, title: 'รอนักศึกษายื่นขอสอบปริญญานิพนธ์ (ส่งสาย)',    description_template: 'นักศึกษายื่นคำร้องขอสอบปริญญานิพนธ์หลังกำหนดเวลา',                            phase_key: 'defense',        phase_variant: 'late' },
  { workflow_type: 'project2', step_key: 'THESIS_DEFENSE_PENDING_LATE_APPROVAL',     step_order: 52, title: 'รอเจ้าหน้าที่พิจารณาคำร้องขอสอบ (ส่งสาย)',    description_template: 'คำร้องขอสอบปริญญานิพนธ์ถูกยื่นหลังกำหนดเวลา',                                  phase_key: 'defense',        phase_variant: 'late' },
  { workflow_type: 'project2', step_key: 'THESIS_DEFENSE_OVERDUE',                   step_order: 53, title: 'หมดเขตยื่นขอสอบปริญญานิพนธ์',                   description_template: 'กำหนดเวลายื่นขอสอบปริญญานิพนธ์สิ้นสุดแล้ว',                                    phase_key: 'defense',        phase_variant: 'overdue' },
  // project2 final document
  { workflow_type: 'project2', step_key: 'THESIS_FINAL_DOCUMENT_PENDING_LATE_SUBMISSION', step_order: 91, title: 'รอนักศึกษาส่งเล่มปริญญานิพนธ์สมบูรณ์ (ส่งสาย)', description_template: 'นักศึกษาส่งเล่มปริญญานิพนธ์หลังกำหนดเวลา',                                   phase_key: 'final_document', phase_variant: 'late' },
  { workflow_type: 'project2', step_key: 'THESIS_FINAL_DOCUMENT_PENDING_LATE_APPROVAL',   step_order: 92, title: 'รอเจ้าหน้าที่พิจารณาเล่มปริญญานิพนธ์ (ส่งสาย)', description_template: 'เล่มปริญญานิพนธ์ถูกส่งหลังกำหนดเวลา',                                         phase_key: 'final_document', phase_variant: 'late' },
  { workflow_type: 'project2', step_key: 'THESIS_FINAL_DOCUMENT_OVERDUE',                 step_order: 93, title: 'หมดเขตส่งเล่มปริญญานิพนธ์สมบูรณ์',            description_template: 'กำหนดเวลาส่งเล่มปริญญานิพนธ์สิ้นสุดแล้ว',                                      phase_key: 'final_document', phase_variant: 'overdue' },
];

async function fetchExistingStepKeys(queryInterface, workflowType) {
  const [rows] = await queryInterface.sequelize.query(
    `SELECT step_key FROM workflow_step_definitions WHERE workflow_type = :workflowType`,
    { replacements: { workflowType } }
  );
  return new Set(rows.map((r) => r.step_key));
}

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    // 1) project2 base steps — idempotent insert
    {
      const existing = await fetchExistingStepKeys(queryInterface, 'project2');
      const missing = PROJECT2_BASE_STEPS.filter((s) => !existing.has(s.step_key));
      if (missing.length > 0) {
        await queryInterface.bulkInsert(
          'workflow_step_definitions',
          missing.map((s) => ({
            workflow_type: 'project2',
            step_key: s.step_key,
            step_order: s.step_order,
            title: s.title,
            description_template: s.description_template,
            phase_variant: 'default',
            created_at: now,
            updated_at: now,
          }))
        );
        console.log(`✅ Inserted ${missing.length} project2 base workflow steps`);
      } else {
        console.log('ℹ️ project2 base workflow steps already present');
      }
    }

    // 2) project1 phase_key — update only rows where phase_key IS NULL
    //    so re-running never overwrites an admin-adjusted value.
    {
      let updated = 0;
      for (const { step_key, phase_key } of PROJECT1_PHASE_MAPPINGS) {
        const [, meta] = await queryInterface.sequelize.query(
          `UPDATE workflow_step_definitions
             SET phase_key = :phase_key, phase_variant = 'default', updated_at = NOW()
           WHERE workflow_type = 'project1'
             AND step_key = :step_key
             AND phase_key IS NULL`,
          { replacements: { step_key, phase_key } }
        );
        if (meta && typeof meta.affectedRows === 'number') updated += meta.affectedRows;
      }
      console.log(`✅ Updated ${updated} project1 phase_key mappings (rows where phase_key was NULL)`);
    }

    // 3) late/overdue step definitions — idempotent insert per workflow_type
    {
      const keysNeeded = new Set(LATE_OVERDUE_STEPS.map((s) => s.step_key));
      const [existingRows] = await queryInterface.sequelize.query(
        `SELECT step_key FROM workflow_step_definitions
          WHERE step_key IN (:keys)`,
        { replacements: { keys: [...keysNeeded] } }
      );
      const existingSet = new Set(existingRows.map((r) => r.step_key));
      const missing = LATE_OVERDUE_STEPS.filter((s) => !existingSet.has(s.step_key));
      if (missing.length > 0) {
        await queryInterface.bulkInsert(
          'workflow_step_definitions',
          missing.map((s) => ({
            workflow_type: s.workflow_type,
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
        console.log(`✅ Inserted ${missing.length} late/overdue phase_variant steps`);
      } else {
        console.log('ℹ️ late/overdue phase_variant steps already present');
      }
    }

    // 4) Cleanup orphan notification_settings rows with empty notification_type
    //    (past enum coerce bug)
    {
      const [, meta] = await queryInterface.sequelize.query(
        `DELETE FROM notification_settings WHERE notification_type = ''`
      );
      if (meta && typeof meta.affectedRows === 'number' && meta.affectedRows > 0) {
        console.log(`✅ Deleted ${meta.affectedRows} orphan notification_settings row(s) with empty type`);
      }
    }
  },

  async down() {
    // No-op: removing these rows would break ProjectWorkflowState /
    // StudentWorkflowActivity references and undo phase_key values that
    // may have been adjusted since.
  },
};
