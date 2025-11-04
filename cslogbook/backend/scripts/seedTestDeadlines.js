#!/usr/bin/env node

/**
 * Script: Seed Test Deadlines
 * 
 * สคริปต์สำหรับเพิ่มข้อมูล deadline ทดสอบเข้าไปในฐานข้อมูล
 * ใช้สำหรับทดสอบระบบ Project Deadline Integration
 * 
 * วิธีการใช้งาน:
 *   node backend/scripts/seedTestDeadlines.js
 * 
 * หรือใช้ npm script:
 *   npm run seed:test-deadlines
 */

const path = require('path');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

// Setup environment
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { ImportantDeadline } = require('../models');

const TEST_DEADLINES = [
  {
    templateId: 'PROJECT1_PROPOSAL_SUBMISSION',
    name: 'ส่งหัวข้อโครงงานพิเศษ 1',
    relatedTo: 'project1',
    deadlineType: 'SUBMISSION',
    documentSubtype: 'PROJECT1_PROPOSAL',
    deadlineAt: '2025-11-15T23:59:59+07:00',
    gracePeriodMinutes: 4320, // 3 วัน
    allowLate: true,
    lockAfterDeadline: false,
    academicYear: '2568',
    semester: 1,
    description: 'กำหนดส่งหัวข้อโครงงานพิเศษ 1 (Proposal)',
    isCritical: true,
    isPublished: true
  },
  {
    templateId: 'PROJECT1_DEFENSE_REQUEST_SUBMISSION',
    name: 'ส่งคำร้องขอสอบ (คพ.02)',
    relatedTo: 'project1',
    deadlineType: 'SUBMISSION',
    documentSubtype: 'PROJECT1_DEFENSE_REQUEST',
    deadlineAt: '2025-11-30T23:59:59+07:00',
    gracePeriodMinutes: 2880, // 2 วัน
    allowLate: true,
    lockAfterDeadline: false,
    academicYear: '2568',
    semester: 1,
    description: 'กำหนดส่งคำร้องขอสอบโครงงานพิเศษ 1 (KP.02)',
    isCritical: true,
    isPublished: true
  },
  {
    templateId: 'PROJECT_SYSTEM_TEST_REQUEST',
    name: 'ยื่นคำขอทดสอบระบบ',
    relatedTo: 'project2',
    deadlineType: 'SUBMISSION',
    documentSubtype: 'PROJECT_SYSTEM_TEST_REQUEST',
    deadlineAt: '2025-12-10T23:59:59+07:00',
    gracePeriodMinutes: 1440, // 1 วัน
    allowLate: true,
    lockAfterDeadline: false,
    academicYear: '2568',
    semester: 1,
    description: 'กำหนดยื่นคำขอทดสอบระบบสำหรับปริญญานิพนธ์',
    isCritical: true,
    isPublished: true
  },
  {
    templateId: 'THESIS_DEFENSE_REQUEST_SUBMISSION',
    name: 'ส่งคำร้องขอสอบปริญญานิพนธ์ (คพ.03)',
    relatedTo: 'project2',
    deadlineType: 'SUBMISSION',
    documentSubtype: 'THESIS_DEFENSE_REQUEST',
    deadlineAt: '2025-12-20T23:59:59+07:00',
    gracePeriodMinutes: 2880, // 2 วัน
    allowLate: true,
    lockAfterDeadline: true, // ⚠️ LOCK
    academicYear: '2568',
    semester: 1,
    description: 'กำหนดส่งคำร้องขอสอบปริญญานิพนธ์ (KP.03)',
    isCritical: true,
    isPublished: true
  },
  {
    templateId: 'THESIS_FINAL_SUBMISSION',
    name: 'ส่งปริญญานิพนธ์ฉบับสมบูรณ์',
    relatedTo: 'project2',
    deadlineType: 'SUBMISSION',
    documentSubtype: 'THESIS_FINAL_REPORT',
    deadlineAt: '2026-01-15T23:59:59+07:00',
    gracePeriodMinutes: 7200, // 5 วัน
    allowLate: true,
    lockAfterDeadline: false,
    academicYear: '2568',
    semester: 1,
    description: 'กำหนดส่งปริญญานิพนธ์ฉบับสมบูรณ์',
    isCritical: true,
    isPublished: true
  }
];

async function seedTestDeadlines() {
  console.log('🌱 Starting to seed test deadlines...\n');

  try {
    let createdCount = 0;
    let skippedCount = 0;

    for (const deadlineData of TEST_DEADLINES) {
      // ตรวจสอบว่ามี deadline นี้อยู่แล้วหรือไม่
      const existing = await ImportantDeadline.findOne({
        where: {
          name: deadlineData.name,
          academicYear: deadlineData.academicYear,
          semester: deadlineData.semester
        }
      });

      if (existing) {
        console.log(`⏭️  Skip: "${deadlineData.name}" (already exists)`);
        skippedCount++;
        continue;
      }

      // สร้าง deadline ใหม่
      const deadline = await ImportantDeadline.create({
        name: deadlineData.name,
        date: dayjs(deadlineData.deadlineAt).tz('Asia/Bangkok').format('YYYY-MM-DD'),
        deadlineAt: new Date(deadlineData.deadlineAt),
        relatedTo: deadlineData.relatedTo,
        academicYear: deadlineData.academicYear,
        semester: deadlineData.semester,
        isGlobal: true,
        description: deadlineData.description,
        isCritical: deadlineData.isCritical,
        acceptingSubmissions: true,
        allowLate: deadlineData.allowLate,
        lockAfterDeadline: deadlineData.lockAfterDeadline,
        gracePeriodMinutes: deadlineData.gracePeriodMinutes,
        timezone: 'Asia/Bangkok',
        deadlineType: deadlineData.deadlineType,
        isPublished: deadlineData.isPublished,
        visibilityScope: 'PROJECT_ONLY'
      });

      console.log(`✅ Created: "${deadline.name}" (ID: ${deadline.id})`);
      console.log(`   📅 Deadline: ${dayjs(deadline.deadlineAt).tz('Asia/Bangkok').format('DD/MM/YYYY HH:mm')}`);
      console.log(`   ⏰ Grace: ${deadline.gracePeriodMinutes} minutes (${Math.floor(deadline.gracePeriodMinutes / 1440)} days)`);
      console.log(`   🔒 Lock: ${deadline.lockAfterDeadline ? 'Yes' : 'No'}\n`);
      
      createdCount++;
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Summary:');
    console.log(`   ✅ Created: ${createdCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);
    console.log(`   📝 Total: ${TEST_DEADLINES.length}`);
    console.log('='.repeat(50));

    if (createdCount > 0) {
      console.log('\n🎉 Test deadlines seeded successfully!');
      console.log('\n📋 Next steps:');
      console.log('   1. ตรวจสอบข้อมูลใน Admin → Settings → Important Deadlines');
      console.log('   2. ทดสอบระบบ deadline enforcement');
      console.log('   3. ดู Late Submissions Report');
    } else {
      console.log('\n⚠️  No new deadlines were created (all already exist)');
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding test deadlines:');
    console.error(error);
    process.exit(1);
  }
}

// Run the script
seedTestDeadlines();

