#!/usr/bin/env node

/**
 * Script: Seed Deadline Test Cases for Staff Queue
 * 
 * สคริปต์สำหรับสร้างข้อมูลทดสอบเพื่อแสดง deadline tags ในหน้า Staff Queue
 * - คพ.02 (PROJECT1_DEFENSE_REQUEST)
 * - คพ.03 (THESIS_DEFENSE_REQUEST)
 * - คำขอทดสอบระบบ (PROJECT_SYSTEM_TEST_REQUEST)
 * 
 * แต่ละประเภทจะมี 3 กรณี:
 * 1. ส่งทันเวลา (ไม่มี tag)
 * 2. ส่งช้าแต่ยังใน grace period (tag สีเหลือง)
 * 3. ส่งหลัง grace period (tag สีแดง - ถ้า lockAfterDeadline = true)
 * 
 * วิธีการใช้งาน:
 *   node backend/scripts/seedDeadlineTestCases.js
 */

const path = require('path');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

// Setup environment
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { sequelize } = require('../config/database');
const {
  ImportantDeadline,
  ProjectDocument,
  ProjectMember,
  ProjectDefenseRequest,
  ProjectTestRequest,
  Student,
  Teacher,
  User
} = require('../models');
const { Op } = require('sequelize');

async function seedDeadlineTestCases() {
  console.log('🌱 Starting to seed deadline test cases...\n');

  const transaction = await sequelize.transaction();

  try {
    // 1. ตรวจสอบและอัปเดต deadlines ให้เป็นเวลาที่เหมาะสมสำหรับการทดสอบ
    console.log('📅 Step 1: Setting up deadlines...');
    
    const now = dayjs().tz('Asia/Bangkok');
    
    // อัปเดต deadline สำหรับ คพ.02 (ให้เป็น 7 วันที่แล้ว)
    const kp02Deadline = await ImportantDeadline.findOne({
      where: {
        name: 'ส่งคำร้องขอสอบ (คพ.02)',
        academicYear: '2568',
        semester: 1
      },
      transaction
    });

    if (kp02Deadline) {
      const kp02DeadlineAt = now.subtract(7, 'day').set('hour', 23).set('minute', 59).set('second', 59);
      await kp02Deadline.update({
        deadlineAt: kp02DeadlineAt.toDate(),
        date: kp02DeadlineAt.format('YYYY-MM-DD'),
        gracePeriodMinutes: 2880, // 2 วัน
        allowLate: true,
        lockAfterDeadline: false
      }, { transaction });
      console.log(`✅ Updated คพ.02 deadline to ${kp02DeadlineAt.format('DD/MM/YYYY HH:mm')}`);
      console.log(`   Grace period: 2 วัน (effective: ${kp02DeadlineAt.add(2880, 'minute').format('DD/MM/YYYY HH:mm')})`);
    }

    // อัปเดต deadline สำหรับ คพ.03 (ให้เป็น 10 วันที่แล้ว)
    const kp03Deadline = await ImportantDeadline.findOne({
      where: {
        name: 'ส่งคำร้องขอสอบปริญญานิพนธ์ (คพ.03)',
        academicYear: '2568',
        semester: 1
      },
      transaction
    });

    if (kp03Deadline) {
      const kp03DeadlineAt = now.subtract(10, 'day').set('hour', 23).set('minute', 59).set('second', 59);
      await kp03Deadline.update({
        deadlineAt: kp03DeadlineAt.toDate(),
        date: kp03DeadlineAt.format('YYYY-MM-DD'),
        gracePeriodMinutes: 2880, // 2 วัน
        allowLate: true,
        lockAfterDeadline: true // ⚠️ LOCK = แสดง tag แดงถ้าส่งหลัง grace
      }, { transaction });
      console.log(`✅ Updated คพ.03 deadline to ${kp03DeadlineAt.format('DD/MM/YYYY HH:mm')}`);
      console.log(`   Grace period: 2 วัน (effective: ${kp03DeadlineAt.add(2880, 'minute').format('DD/MM/YYYY HH:mm')})`);
      console.log(`   🔒 Lock after deadline: YES`);
    }

    // อัปเดต deadline สำหรับคำขอทดสอบระบบ (ให้เป็น 5 วันที่แล้ว)
    const systemTestDeadline = await ImportantDeadline.findOne({
      where: {
        name: 'ยื่นคำขอทดสอบระบบ',
        academicYear: '2568',
        semester: 1
      },
      transaction
    });

    if (systemTestDeadline) {
      const systemTestDeadlineAt = now.subtract(5, 'day').set('hour', 23).set('minute', 59).set('second', 59);
      await systemTestDeadline.update({
        deadlineAt: systemTestDeadlineAt.toDate(),
        date: systemTestDeadlineAt.format('YYYY-MM-DD'),
        gracePeriodMinutes: 1440, // 1 วัน
        allowLate: true,
        lockAfterDeadline: false
      }, { transaction });
      console.log(`✅ Updated System Test deadline to ${systemTestDeadlineAt.format('DD/MM/YYYY HH:mm')}`);
      console.log(`   Grace period: 1 วัน (effective: ${systemTestDeadlineAt.add(1440, 'minute').format('DD/MM/YYYY HH:mm')})\n`);
    }

    // 2. ค้นหา projects และ students ที่มีอยู่
    console.log('🔍 Step 2: Finding existing projects and students...');
    
    const projects = await ProjectDocument.findAll({
      where: {
        academicYear: 2568,
        semester: 1
      },
      include: [{
        model: ProjectMember,
        as: 'members',
        include: [{
          model: Student,
          as: 'student'
        }]
      }],
      limit: 10,
      transaction
    });

    if (projects.length < 3) {
      console.log('⚠️  Not enough projects found. Please seed projects first.');
      console.log('   Run: npm run seed:dev or create projects manually');
      await transaction.rollback();
      process.exit(1);
    }

    console.log(`   Found ${projects.length} projects\n`);

    // 3. ลบ Defense Requests เดิมออกก่อน (ถ้ามี)
    console.log('🗑️  Step 3: Cleaning up old test data...');
    
    const projectIds = projects.map(p => p.projectId);
    const deletedDefenseRequests = await ProjectDefenseRequest.destroy({
      where: {
        projectId: { [Op.in]: projectIds }
      },
      transaction
    });
    
    const deletedSystemTestRequests = await ProjectTestRequest.destroy({
      where: {
        projectId: { [Op.in]: projectIds }
      },
      transaction
    });
    
    console.log(`   Deleted ${deletedDefenseRequests} defense requests`);
    console.log(`   Deleted ${deletedSystemTestRequests} system test requests\n`);

    // 4. สร้าง Defense Requests (คพ.02 และ คพ.03)
    console.log('📝 Step 4: Creating Defense Requests...\n');

    const defenseRequests = [];
    
    // === คพ.02 (PROJECT1) - 3 กรณี ===
    if (kp02Deadline && projects.length >= 3) {
      const kp02DeadlineTime = dayjs(kp02Deadline.deadlineAt).tz('Asia/Bangkok');
      const kp02EffectiveDeadline = kp02DeadlineTime.add(kp02Deadline.gracePeriodMinutes, 'minute');

      // Case 1: ส่งทันเวลา (2 วันก่อน deadline)
      const project1 = projects[0];
      const student1 = project1.members?.[0]?.student;
      if (student1) {
        const onTimeSubmission = kp02DeadlineTime.subtract(2, 'day');
        defenseRequests.push({
          projectId: project1.projectId,
          defenseType: 'PROJECT1',
          status: 'advisor_approved',
          formPayload: {
            requestDate: onTimeSubmission.format('YYYY-MM-DD'),
            additionalNotes: '✅ ส่งทันเวลา - Test Case 1'
          },
          submittedByStudentId: student1.studentId,
          submittedAt: onTimeSubmission.toDate(),
          advisorApprovedAt: onTimeSubmission.add(1, 'hour').toDate()
        });
        console.log(`   [คพ.02-1] ✅ ON TIME: ${project1.projectCode || `#${project1.projectId}`} - ${project1.thaiTitle || project1.englishTitle || 'ไม่มีชื่อ'}`);
        console.log(`              ส่งเมื่อ ${onTimeSubmission.format('DD/MM/YYYY HH:mm')} (ก่อน deadline 2 วัน)`);
      }

      // Case 2: ส่งช้าแต่ยังใน grace period (12 ชม.หลัง deadline)
      const project2 = projects[1];
      const student2 = project2.members?.[0]?.student;
      if (student2) {
        const lateSubmission = kp02DeadlineTime.add(12, 'hour');
        defenseRequests.push({
          projectId: project2.projectId,
          defenseType: 'PROJECT1',
          status: 'advisor_approved',
          formPayload: {
            requestDate: lateSubmission.format('YYYY-MM-DD'),
            additionalNotes: '⚠️ ส่งช้า 12 ชม. (ยังใน grace period) - Test Case 2'
          },
          submittedByStudentId: student2.studentId,
          submittedAt: lateSubmission.toDate(),
          advisorApprovedAt: lateSubmission.add(1, 'hour').toDate()
        });
        console.log(`   [คพ.02-2] ⚠️  LATE: ${project2.projectCode || `#${project2.projectId}`} - ${project2.thaiTitle || project2.englishTitle || 'ไม่มีชื่อ'}`);
        console.log(`              ส่งเมื่อ ${lateSubmission.format('DD/MM/YYYY HH:mm')} (หลัง deadline 12 ชม.)`);
      }

      // Case 3: ส่งหลัง grace period (3 วันหลัง deadline)
      const project3 = projects[2];
      const student3 = project3.members?.[0]?.student;
      if (student3) {
        const veryLateSubmission = kp02EffectiveDeadline.add(1, 'day');
        defenseRequests.push({
          projectId: project3.projectId,
          defenseType: 'PROJECT1',
          status: 'advisor_approved',
          formPayload: {
            requestDate: veryLateSubmission.format('YYYY-MM-DD'),
            additionalNotes: '🔴 ส่งหลัง grace period - Test Case 3 (แต่ไม่ lock เพราะ lockAfterDeadline = false)'
          },
          submittedByStudentId: student3.studentId,
          submittedAt: veryLateSubmission.toDate(),
          advisorApprovedAt: veryLateSubmission.add(1, 'hour').toDate()
        });
        console.log(`   [คพ.02-3] ⚠️  VERY LATE: ${project3.projectCode || `#${project3.projectId}`} - ${project3.thaiTitle || project3.englishTitle || 'ไม่มีชื่อ'}`);
        console.log(`              ส่งเมื่อ ${veryLateSubmission.format('DD/MM/YYYY HH:mm')} (หลัง grace 1 วัน)`);
      }
    }

    // === คพ.03 (THESIS) - 3 กรณี ===
    if (kp03Deadline && projects.length >= 6) {
      const kp03DeadlineTime = dayjs(kp03Deadline.deadlineAt).tz('Asia/Bangkok');
      const kp03EffectiveDeadline = kp03DeadlineTime.add(kp03Deadline.gracePeriodMinutes, 'minute');

      // Case 4: ส่งทันเวลา (1 วันก่อน deadline)
      const project4 = projects[3];
      const student4 = project4.members?.[0]?.student;
      if (student4) {
        const onTimeSubmission = kp03DeadlineTime.subtract(1, 'day');
        defenseRequests.push({
          projectId: project4.projectId,
          defenseType: 'THESIS',
          status: 'advisor_approved',
          formPayload: {
            requestDate: onTimeSubmission.format('YYYY-MM-DD'),
            intendedDefenseDate: onTimeSubmission.add(14, 'day').format('YYYY-MM-DD'),
            additionalNotes: '✅ ส่งทันเวลา - Test Case 4'
          },
          submittedByStudentId: student4.studentId,
          submittedAt: onTimeSubmission.toDate(),
          advisorApprovedAt: onTimeSubmission.add(2, 'hour').toDate()
        });
        console.log(`\n   [คพ.03-1] ✅ ON TIME: ${project4.projectCode || `#${project4.projectId}`} - ${project4.thaiTitle || project4.englishTitle || 'ไม่มีชื่อ'}`);
        console.log(`              ส่งเมื่อ ${onTimeSubmission.format('DD/MM/YYYY HH:mm')} (ก่อน deadline 1 วัน)`);
      }

      // Case 5: ส่งช้าแต่ยังใน grace period (1 วันหลัง deadline)
      const project5 = projects[4];
      const student5 = project5.members?.[0]?.student;
      if (student5) {
        const lateSubmission = kp03DeadlineTime.add(1, 'day');
        defenseRequests.push({
          projectId: project5.projectId,
          defenseType: 'THESIS',
          status: 'advisor_approved',
          formPayload: {
            requestDate: lateSubmission.format('YYYY-MM-DD'),
            intendedDefenseDate: lateSubmission.add(14, 'day').format('YYYY-MM-DD'),
            additionalNotes: '⚠️ ส่งช้า 1 วัน (ยังใน grace period) - Test Case 5'
          },
          submittedByStudentId: student5.studentId,
          submittedAt: lateSubmission.toDate(),
          advisorApprovedAt: lateSubmission.add(2, 'hour').toDate()
        });
        console.log(`   [คพ.03-2] ⚠️  LATE: ${project5.projectCode || `#${project5.projectId}`} - ${project5.thaiTitle || project5.englishTitle || 'ไม่มีชื่อ'}`);
        console.log(`              ส่งเมื่อ ${lateSubmission.format('DD/MM/YYYY HH:mm')} (หลัง deadline 1 วัน)`);
      }

      // Case 6: ส่งหลัง grace period (4 วันหลัง deadline) - จะแสดง tag แดงเพราะ lockAfterDeadline = true
      const project6 = projects[5];
      const student6 = project6.members?.[0]?.student;
      if (student6) {
        const lockedSubmission = kp03EffectiveDeadline.add(1, 'day');
        defenseRequests.push({
          projectId: project6.projectId,
          defenseType: 'THESIS',
          status: 'advisor_approved',
          formPayload: {
            requestDate: lockedSubmission.format('YYYY-MM-DD'),
            intendedDefenseDate: lockedSubmission.add(14, 'day').format('YYYY-MM-DD'),
            additionalNotes: '🔴 ส่งหลัง grace period (LOCKED) - Test Case 6'
          },
          submittedByStudentId: student6.studentId,
          submittedAt: lockedSubmission.toDate(),
          advisorApprovedAt: lockedSubmission.add(2, 'hour').toDate()
        });
        console.log(`   [คพ.03-3] 🔴 LOCKED: ${project6.projectCode || `#${project6.projectId}`} - ${project6.thaiTitle || project6.englishTitle || 'ไม่มีชื่อ'}`);
        console.log(`              ส่งเมื่อ ${lockedSubmission.format('DD/MM/YYYY HH:mm')} (หลัง grace 1 วัน)`);
      }
    }

    // Insert defense requests
    if (defenseRequests.length > 0) {
      await ProjectDefenseRequest.bulkCreate(defenseRequests, { transaction });
      console.log(`\n✅ Created ${defenseRequests.length} defense requests\n`);
    }

    // 5. สร้าง System Test Requests - 3 กรณี
    console.log('📝 Step 5: Creating System Test Requests...\n');

    const systemTestRequests = [];

    if (systemTestDeadline && projects.length >= 9) {
      const systemTestDeadlineTime = dayjs(systemTestDeadline.deadlineAt).tz('Asia/Bangkok');
      const systemTestEffectiveDeadline = systemTestDeadlineTime.add(systemTestDeadline.gracePeriodMinutes, 'minute');

      // หา advisorId จาก project
      const getAdvisorId = (project) => project.advisorId || null;

      // Case 7: ส่งทันเวลา (3 วันก่อน deadline)
      const project7 = projects[6];
      const student7 = project7.members?.[0]?.student;
      if (student7) {
        const onTimeSubmission = systemTestDeadlineTime.subtract(3, 'day');
        const testStartDate = onTimeSubmission.toDate();
        const testDueDate = onTimeSubmission.add(30, 'day').toDate();
        
        systemTestRequests.push({
          projectId: project7.projectId,
          submittedByStudentId: student7.studentId,
          status: 'pending_staff',
          submittedAt: onTimeSubmission.toDate(),
          testStartDate,
          testDueDate,
          studentNote: '✅ ส่งทันเวลา - Test Case 7',
          advisorTeacherId: getAdvisorId(project7),
          advisorDecidedAt: onTimeSubmission.add(1, 'hour').toDate()
        });
        console.log(`   [SystemTest-1] ✅ ON TIME: ส่งเมื่อ ${onTimeSubmission.format('DD/MM/YYYY HH:mm')} (ก่อน deadline 3 วัน)`);
      }

      // Case 8: ส่งช้าแต่ยังใน grace period (6 ชม.หลัง deadline)
      const project8 = projects[7];
      const student8 = project8.members?.[0]?.student;
      if (student8) {
        const lateSubmission = systemTestDeadlineTime.add(6, 'hour');
        const testStartDate = lateSubmission.toDate();
        const testDueDate = lateSubmission.add(30, 'day').toDate();
        
        systemTestRequests.push({
          projectId: project8.projectId,
          submittedByStudentId: student8.studentId,
          status: 'pending_staff',
          submittedAt: lateSubmission.toDate(),
          testStartDate,
          testDueDate,
          studentNote: '⚠️ ส่งช้า 6 ชม. (ยังใน grace period) - Test Case 8',
          advisorTeacherId: getAdvisorId(project8),
          advisorDecidedAt: lateSubmission.add(1, 'hour').toDate()
        });
        console.log(`   [SystemTest-2] ⚠️  LATE: ส่งเมื่อ ${lateSubmission.format('DD/MM/YYYY HH:mm')} (หลัง deadline 6 ชม.)`);
      }

      // Case 9: ส่งหลัง grace period (2 วันหลัง deadline)
      const project9 = projects[8];
      const student9 = project9.members?.[0]?.student;
      if (student9) {
        const veryLateSubmission = systemTestEffectiveDeadline.add(12, 'hour');
        const testStartDate = veryLateSubmission.toDate();
        const testDueDate = veryLateSubmission.add(30, 'day').toDate();
        
        systemTestRequests.push({
          projectId: project9.projectId,
          submittedByStudentId: student9.studentId,
          status: 'pending_staff',
          submittedAt: veryLateSubmission.toDate(),
          testStartDate,
          testDueDate,
          studentNote: '⚠️ ส่งหลัง grace period - Test Case 9 (ไม่ lock เพราะ lockAfterDeadline = false)',
          advisorTeacherId: getAdvisorId(project9),
          advisorDecidedAt: veryLateSubmission.add(1, 'hour').toDate()
        });
        console.log(`   [SystemTest-3] ⚠️  VERY LATE: ส่งเมื่อ ${veryLateSubmission.format('DD/MM/YYYY HH:mm')} (หลัง grace 12 ชม.)`);
      }
    }

    // Insert system test requests
    if (systemTestRequests.length > 0) {
      await ProjectTestRequest.bulkCreate(systemTestRequests, { transaction });
      console.log(`\n✅ Created ${systemTestRequests.length} system test requests\n`);
    }

    await transaction.commit();

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 SUMMARY:');
    console.log('='.repeat(70));
    console.log(`✅ Defense Requests (คพ.02 + คพ.03): ${defenseRequests.length}`);
    console.log(`✅ System Test Requests: ${systemTestRequests.length}`);
    console.log(`📝 Total Test Cases: ${defenseRequests.length + systemTestRequests.length}`);
    console.log('='.repeat(70));

    console.log('\n🎉 Test cases seeded successfully!\n');
    console.log('📋 Next steps:');
    console.log('   1. เข้าหน้า /admin/project1/kp02-queue ดูคำร้อง คพ.02');
    console.log('   2. เข้าหน้า /admin/thesis/staff-queue ดูคำร้อง คพ.03');
    console.log('   3. เข้าหน้า /admin/system-test/staff-queue ดูคำขอทดสอบระบบ');
    console.log('   4. สังเกต deadline tags:');
    console.log('      - ✅ ไม่มี tag = ส่งทันเวลา');
    console.log('      - ⚠️  tag สีเหลือง "ส่งช้า" = ส่งหลัง deadline แต่ยังใน grace period');
    console.log('      - 🔴 tag สีแดง "ส่งหลังหมดเวลา" = ส่งหลัง grace period (เฉพาะที่ lockAfterDeadline = true)');
    console.log('\n');

    process.exit(0);
  } catch (error) {
    await transaction.rollback();
    console.error('\n❌ Error seeding test cases:');
    console.error(error);
    process.exit(1);
  }
}

// Run the script
seedDeadlineTestCases();

