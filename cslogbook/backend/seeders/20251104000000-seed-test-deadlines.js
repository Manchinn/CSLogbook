'use strict';

/**
 * Seeder: Test Deadlines for Project Deadline Integration Testing
 * 
 * สร้างข้อมูล deadline ตามที่ระบุใน test-data-samples.json
 * สำหรับทดสอบระบบ Deadline Integration
 * 
 * วันที่: 4 พฤศจิกายน 2568
 * 
 * Deadlines:
 * 1. PROJECT1_PROPOSAL_SUBMISSION - ส่งหัวข้อโครงงานพิเศษ 1
 * 2. PROJECT1_DEFENSE_REQUEST_SUBMISSION - ส่งคำร้องขอสอบ (คพ.02)
 * 3. PROJECT_SYSTEM_TEST_REQUEST - ยื่นคำขอทดสอบระบบ
 * 4. THESIS_DEFENSE_REQUEST_SUBMISSION - ส่งคำร้องขอสอบปริญญานิพนธ์ (คพ.03)
 * 5. THESIS_FINAL_SUBMISSION - ส่งปริญญานิพนธ์ฉบับสมบูรณ์
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const currentDate = new Date();
    const academicYear = '2568';
    const semester = 1;

    // ตรวจสอบว่ามี deadline อยู่แล้วหรือไม่
    const existingDeadlines = await queryInterface.sequelize.query(
      `SELECT name FROM important_deadlines 
       WHERE academic_year = :academicYear 
       AND semester = :semester 
       AND name IN (
         'ส่งหัวข้อโครงงานพิเศษ 1',
         'ส่งคำร้องขอสอบ (คพ.02)',
         'ยื่นคำขอทดสอบระบบ',
         'ส่งคำร้องขอสอบปริญญานิพนธ์ (คพ.03)',
         'ส่งปริญญานิพนธ์ฉบับสมบูรณ์'
       )`,
      {
        replacements: { academicYear, semester },
        type: Sequelize.QueryTypes.SELECT
      }
    );

    if (existingDeadlines.length > 0) {
      console.log('⚠️  Test deadlines already exist. Skipping...');
      console.log('Existing deadlines:', existingDeadlines.map(d => d.name));
      return;
    }

    const deadlines = [
      {
        // 1. PROJECT1_PROPOSAL_SUBMISSION
        name: 'ส่งหัวข้อโครงงานพิเศษ 1',
        date: '2025-11-15', // legacy date field
        deadline_at: new Date('2025-11-15T23:59:59+07:00'), // UTC: 2025-11-15T16:59:59Z
        related_to: 'project1',
        deadline_type: 'SUBMISSION',
        academic_year: academicYear,
        semester: semester,
        is_global: true,
        description: 'กำหนดส่งหัวข้อโครงงานพิเศษ 1 (Proposal) - ตาม templateId: PROJECT1_PROPOSAL_SUBMISSION',
        is_critical: true,
        accepting_submissions: true,
        allow_late: true,
        lock_after_deadline: false,
        grace_period_minutes: 4320, // 3 วัน (3 * 24 * 60)
        timezone: 'Asia/Bangkok',
        is_published: true,
        publish_at: new Date('2025-11-01T00:00:00+07:00'),
        visibility_scope: 'PROJECT_ONLY',
        created_at: currentDate,
        updated_at: currentDate
      },
      {
        // 2. PROJECT1_DEFENSE_REQUEST_SUBMISSION
        name: 'ส่งคำร้องขอสอบ (คพ.02)',
        date: '2025-11-30',
        deadline_at: new Date('2025-11-30T23:59:59+07:00'), // UTC: 2025-11-30T16:59:59Z
        related_to: 'project1',
        deadline_type: 'SUBMISSION',
        academic_year: academicYear,
        semester: semester,
        is_global: true,
        description: 'กำหนดส่งคำร้องขอสอบโครงงานพิเศษ 1 (KP.02) - ตาม templateId: PROJECT1_DEFENSE_REQUEST_SUBMISSION',
        is_critical: true,
        accepting_submissions: true,
        allow_late: true,
        lock_after_deadline: false,
        grace_period_minutes: 2880, // 2 วัน (2 * 24 * 60)
        timezone: 'Asia/Bangkok',
        is_published: true,
        publish_at: new Date('2025-11-01T00:00:00+07:00'),
        visibility_scope: 'PROJECT_ONLY',
        created_at: currentDate,
        updated_at: currentDate
      },
      {
        // 3. PROJECT_SYSTEM_TEST_REQUEST
        name: 'ยื่นคำขอทดสอบระบบ',
        date: '2025-12-10',
        deadline_at: new Date('2025-12-10T23:59:59+07:00'), // UTC: 2025-12-10T16:59:59Z
        related_to: 'project2',
        deadline_type: 'SUBMISSION',
        academic_year: academicYear,
        semester: semester,
        is_global: true,
        description: 'กำหนดยื่นคำขอทดสอบระบบสำหรับปริญญานิพนธ์ - ตาม templateId: PROJECT_SYSTEM_TEST_REQUEST',
        is_critical: true,
        accepting_submissions: true,
        allow_late: true,
        lock_after_deadline: false,
        grace_period_minutes: 1440, // 1 วัน (24 * 60)
        timezone: 'Asia/Bangkok',
        is_published: true,
        publish_at: new Date('2025-11-15T00:00:00+07:00'),
        visibility_scope: 'PROJECT_ONLY',
        created_at: currentDate,
        updated_at: currentDate
      },
      {
        // 4. THESIS_DEFENSE_REQUEST_SUBMISSION
        name: 'ส่งคำร้องขอสอบปริญญานิพนธ์ (คพ.03)',
        date: '2025-12-20',
        deadline_at: new Date('2025-12-20T23:59:59+07:00'), // UTC: 2025-12-20T16:59:59Z
        related_to: 'project2',
        deadline_type: 'SUBMISSION',
        academic_year: academicYear,
        semester: semester,
        is_global: true,
        description: 'กำหนดส่งคำร้องขอสอบปริญญานิพนธ์ (KP.03) - ตาม templateId: THESIS_DEFENSE_REQUEST_SUBMISSION',
        is_critical: true,
        accepting_submissions: true,
        allow_late: true,
        lock_after_deadline: true, // ⚠️ LOCK หลังเลยกำหนด
        grace_period_minutes: 2880, // 2 วัน (2 * 24 * 60)
        timezone: 'Asia/Bangkok',
        is_published: true,
        publish_at: new Date('2025-11-20T00:00:00+07:00'),
        visibility_scope: 'PROJECT_ONLY',
        created_at: currentDate,
        updated_at: currentDate
      },
      {
        // 5. THESIS_FINAL_SUBMISSION
        name: 'ส่งปริญญานิพนธ์ฉบับสมบูรณ์',
        date: '2026-01-15',
        deadline_at: new Date('2026-01-15T23:59:59+07:00'), // UTC: 2026-01-15T16:59:59Z
        related_to: 'project2',
        deadline_type: 'SUBMISSION',
        academic_year: academicYear,
        semester: semester,
        is_global: true,
        description: 'กำหนดส่งปริญญานิพนธ์ฉบับสมบูรณ์ - ตาม templateId: THESIS_FINAL_SUBMISSION',
        is_critical: true,
        accepting_submissions: true,
        allow_late: true,
        lock_after_deadline: false, // อนุญาตส่งช้า
        grace_period_minutes: 7200, // 5 วัน (5 * 24 * 60)
        timezone: 'Asia/Bangkok',
        is_published: true,
        publish_at: new Date('2025-12-01T00:00:00+07:00'),
        visibility_scope: 'PROJECT_ONLY',
        created_at: currentDate,
        updated_at: currentDate
      }
    ];

    // Insert deadlines
    await queryInterface.bulkInsert('important_deadlines', deadlines);

    console.log('✅ Successfully seeded 5 test deadlines for academic year 2568/1');
    console.log('📅 Deadlines:');
    deadlines.forEach((d, i) => {
      console.log(`   ${i + 1}. ${d.name} - ${d.date} (${d.related_to})`);
    });
  },

  down: async (queryInterface, Sequelize) => {
    const academicYear = '2568';
    const semester = 1;

    await queryInterface.sequelize.query(
      `DELETE FROM important_deadlines 
       WHERE academic_year = :academicYear 
       AND semester = :semester 
       AND name IN (
         'ส่งหัวข้อโครงงานพิเศษ 1',
         'ส่งคำร้องขอสอบ (คพ.02)',
         'ยื่นคำขอทดสอบระบบ',
         'ส่งคำร้องขอสอบปริญญานิพนธ์ (คพ.03)',
         'ส่งปริญญานิพนธ์ฉบับสมบูรณ์'
       )`,
      {
        replacements: { academicYear, semester }
      }
    );

    console.log('✅ Successfully removed test deadlines');
  }
};

