'use strict';

/**
 * แก้ไขลำดับ step ของ internship workflow ใน workflow_step_definitions
 *
 * ปัญหา: step_order ซ้ำกัน + สลับลำดับ + CS05_APPROVAL_PENDING หายไป
 * สาเหตุ: restore seeder (20251122) ลบ CS05_APPROVAL_PENDING ออกและ compress order
 *         ทำให้ข้อมูลใน DB ไม่สอดคล้องกับ flow จริง
 *
 * ลำดับที่ถูกต้อง (10 steps):
 *  1  INTERNSHIP_ELIGIBILITY_MET
 *  2  INTERNSHIP_CS05_SUBMITTED
 *  3  INTERNSHIP_CS05_APPROVAL_PENDING  ← เพิ่มกลับถ้าหายไป
 *  4  INTERNSHIP_CS05_APPROVED
 *  5  INTERNSHIP_COMPANY_RESPONSE_PENDING
 *  6  INTERNSHIP_COMPANY_RESPONSE_RECEIVED
 *  7  INTERNSHIP_AWAITING_START
 *  8  INTERNSHIP_IN_PROGRESS
 *  9  INTERNSHIP_SUMMARY_PENDING
 * 10  INTERNSHIP_COMPLETED
 */
module.exports = {
  async up(queryInterface) {
    const correctOrder = [
      { step_key: 'INTERNSHIP_ELIGIBILITY_MET',            step_order: 1 },
      { step_key: 'INTERNSHIP_CS05_SUBMITTED',             step_order: 2 },
      { step_key: 'INTERNSHIP_CS05_APPROVAL_PENDING',      step_order: 3 },
      { step_key: 'INTERNSHIP_CS05_APPROVED',              step_order: 4 },
      { step_key: 'INTERNSHIP_COMPANY_RESPONSE_PENDING',   step_order: 5 },
      { step_key: 'INTERNSHIP_COMPANY_RESPONSE_RECEIVED',  step_order: 6 },
      { step_key: 'INTERNSHIP_AWAITING_START',             step_order: 7 },
      { step_key: 'INTERNSHIP_IN_PROGRESS',                step_order: 8 },
      { step_key: 'INTERNSHIP_SUMMARY_PENDING',            step_order: 9 },
      { step_key: 'INTERNSHIP_COMPLETED',                  step_order: 10 },
    ];

    // 1) เช็คว่า CS05_APPROVAL_PENDING มีอยู่หรือไม่ — ถ้าไม่มีให้ insert
    const [existing] = await queryInterface.sequelize.query(
      `SELECT step_id FROM workflow_step_definitions
       WHERE workflow_type = 'internship' AND step_key = 'INTERNSHIP_CS05_APPROVAL_PENDING'`
    );

    if (existing.length === 0) {
      const now = new Date();
      await queryInterface.bulkInsert('workflow_step_definitions', [{
        workflow_type: 'internship',
        step_key: 'INTERNSHIP_CS05_APPROVAL_PENDING',
        step_order: 3,
        title: 'รอการอนุมัติ คพ.05',
        description_template: 'คำร้อง คพ.05 ของคุณกำลังรอการพิจารณาจากเจ้าหน้าที่/อาจารย์',
        created_at: now,
        updated_at: now,
      }]);
      console.log('✅ Inserted missing step: INTERNSHIP_CS05_APPROVAL_PENDING');
    }

    // 2) อัปเดต step_order ทุก row ให้ตรงกับลำดับที่ถูกต้อง
    for (const { step_key, step_order } of correctOrder) {
      await queryInterface.sequelize.query(
        `UPDATE workflow_step_definitions
         SET step_order = :step_order, updated_at = NOW()
         WHERE workflow_type = 'internship' AND step_key = :step_key`,
        { replacements: { step_order, step_key } }
      );
    }

    console.log('✅ Fixed internship workflow step order (10 steps, order 1-10)');
  },

  async down(queryInterface) {
    // Revert กลับไปเป็น 9 steps (restore seeder order) — ลบ CS05_APPROVAL_PENDING
    const revertOrder = [
      { step_key: 'INTERNSHIP_ELIGIBILITY_MET',            step_order: 1 },
      { step_key: 'INTERNSHIP_CS05_SUBMITTED',             step_order: 2 },
      { step_key: 'INTERNSHIP_CS05_APPROVED',              step_order: 3 },
      { step_key: 'INTERNSHIP_COMPANY_RESPONSE_PENDING',   step_order: 4 },
      { step_key: 'INTERNSHIP_COMPANY_RESPONSE_RECEIVED',  step_order: 5 },
      { step_key: 'INTERNSHIP_AWAITING_START',             step_order: 6 },
      { step_key: 'INTERNSHIP_IN_PROGRESS',                step_order: 7 },
      { step_key: 'INTERNSHIP_SUMMARY_PENDING',            step_order: 8 },
      { step_key: 'INTERNSHIP_COMPLETED',                  step_order: 9 },
    ];

    for (const { step_key, step_order } of revertOrder) {
      await queryInterface.sequelize.query(
        `UPDATE workflow_step_definitions
         SET step_order = :step_order, updated_at = NOW()
         WHERE workflow_type = 'internship' AND step_key = :step_key`,
        { replacements: { step_order, step_key } }
      );
    }

    await queryInterface.sequelize.query(
      `DELETE FROM workflow_step_definitions
       WHERE workflow_type = 'internship' AND step_key = 'INTERNSHIP_CS05_APPROVAL_PENDING'`
    );
  }
};
