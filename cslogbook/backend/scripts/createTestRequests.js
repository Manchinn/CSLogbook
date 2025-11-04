/**
 * สร้างข้อมูลทดสอบ Defense Requests สำหรับแสดง Deadline Tags
 */
const path = require('path');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { sequelize } = require('../config/database');
const { ProjectDefenseRequest, ProjectMember, Student } = require('../models');
const { Op } = require('sequelize');

async function createTestRequests() {
  console.log('🌱 สร้างข้อมูลทดสอบ Defense Requests...\n');

  const transaction = await sequelize.transaction();

  try {
    // หา projects ที่มีอยู่แล้ว (ภาค 2/2568)
    const projects = await ProjectMember.findAll({
      include: [
        {
          model: Student,
          as: 'student',
          required: true
        }
      ],
      where: {
        role: 'owner'
      },
      limit: 6,
      transaction
    });

    if (projects.length === 0) {
      console.log('❌ ไม่พบโครงงานในระบบ');
      await transaction.rollback();
      await sequelize.close();
      process.exit(1);
    }

    console.log(`📦 พบ ${projects.length} โครงงาน\n`);

    // ลบ defense requests เดิมออกก่อน (ถ้ามี)
    const projectIds = projects.map(p => p.projectId);
    await ProjectDefenseRequest.destroy({
      where: {
        projectId: { [Op.in]: projectIds }
      },
      transaction
    });

    const defenseRequests = [];

    // สร้าง คพ.02 (PROJECT1) - 3 กรณี
    // Deadline: 15 มีนาคม 2026 23:59 + grace 2 วัน = 17 มีนาคม 2026 23:59
    
    if (projects.length >= 1) {
      // Test Case 1: ส่งทันเวลา (ก่อน deadline 2 วัน)
      defenseRequests.push({
        projectId: projects[0].projectId,
        defenseType: 'PROJECT1',
        status: 'advisor_approved',
        formPayload: JSON.stringify({
          requestDate: '2026-03-13',
          additionalNotes: '✅ ส่งทันเวลา - Test Case 1'
        }),
        submittedByStudentId: projects[0].studentId,
        submittedAt: dayjs.tz('2026-03-13 23:59:59', 'Asia/Bangkok').toDate(),
        advisorApprovedAt: dayjs.tz('2026-03-14 00:59:59', 'Asia/Bangkok').toDate()
      });
      console.log('[คพ.02-1] ✅ ON TIME: ส่งเมื่อ 13/03/2026 (ก่อน deadline 2 วัน)');
    }

    if (projects.length >= 2) {
      // Test Case 2: ส่งช้า แต่ยังอยู่ใน grace period
      defenseRequests.push({
        projectId: projects[1].projectId,
        defenseType: 'PROJECT1',
        status: 'advisor_approved',
        formPayload: JSON.stringify({
          requestDate: '2026-03-16',
          additionalNotes: '⚠️ ส่งช้า 12 ชม. (ยังใน grace period) - Test Case 2'
        }),
        submittedByStudentId: projects[1].studentId,
        submittedAt: dayjs.tz('2026-03-16 11:59:59', 'Asia/Bangkok').toDate(),
        advisorApprovedAt: dayjs.tz('2026-03-16 12:59:59', 'Asia/Bangkok').toDate()
      });
      console.log('[คพ.02-2] ⚠️  LATE: ส่งเมื่อ 16/03/2026 11:59 (หลัง deadline 12 ชม.)');
    }

    if (projects.length >= 3) {
      // Test Case 3: ส่งช้ามาก หลัง grace period (แต่ไม่ lock เพราะ lockAfterDeadline = false)
      defenseRequests.push({
        projectId: projects[2].projectId,
        defenseType: 'PROJECT1',
        status: 'advisor_approved',
        formPayload: JSON.stringify({
          requestDate: '2026-03-18',
          additionalNotes: '🔴 ส่งหลัง grace period - Test Case 3 (แต่ไม่ lock เพราะ lockAfterDeadline = false)'
        }),
        submittedByStudentId: projects[2].studentId,
        submittedAt: dayjs.tz('2026-03-18 23:59:59', 'Asia/Bangkok').toDate(),
        advisorApprovedAt: dayjs.tz('2026-03-19 00:59:59', 'Asia/Bangkok').toDate()
      });
      console.log('[คพ.02-3] ⚠️  VERY LATE: ส่งเมื่อ 18/03/2026 (หลัง grace 1 วัน)\n');
    }

    // สร้าง คพ.03 (THESIS) - 3 กรณี
    // Deadline: 10 มีนาคม 2026 23:59 + grace 2 วัน = 12 มีนาคม 2026 23:59 (🔒 LOCK)
    
    if (projects.length >= 4) {
      // Test Case 4: ส่งทันเวลา
      defenseRequests.push({
        projectId: projects[3].projectId,
        defenseType: 'THESIS',
        status: 'advisor_approved',
        formPayload: JSON.stringify({
          requestDate: '2026-03-09',
          intendedDefenseDate: '2026-03-25',
          additionalNotes: '✅ ส่งทันเวลา - Test Case 4'
        }),
        submittedByStudentId: projects[3].studentId,
        submittedAt: dayjs.tz('2026-03-09 23:59:59', 'Asia/Bangkok').toDate(),
        advisorApprovedAt: dayjs.tz('2026-03-10 01:59:59', 'Asia/Bangkok').toDate()
      });
      console.log('[คพ.03-1] ✅ ON TIME: ส่งเมื่อ 09/03/2026 (ก่อน deadline 1 วัน)');
    }

    if (projects.length >= 5) {
      // Test Case 5: ส่งช้า แต่ยังใน grace period
      defenseRequests.push({
        projectId: projects[4].projectId,
        defenseType: 'THESIS',
        status: 'advisor_approved',
        formPayload: JSON.stringify({
          requestDate: '2026-03-11',
          intendedDefenseDate: '2026-03-27',
          additionalNotes: '⚠️ ส่งช้า 1 วัน (ยังใน grace period) - Test Case 5'
        }),
        submittedByStudentId: projects[4].studentId,
        submittedAt: dayjs.tz('2026-03-11 23:59:59', 'Asia/Bangkok').toDate(),
        advisorApprovedAt: dayjs.tz('2026-03-12 01:59:59', 'Asia/Bangkok').toDate()
      });
      console.log('[คพ.03-2] ⚠️  LATE: ส่งเมื่อ 11/03/2026 (หลัง deadline 1 วัน)');
    }

    if (projects.length >= 6) {
      // Test Case 6: ส่งหลัง grace period + LOCKED
      defenseRequests.push({
        projectId: projects[5].projectId,
        defenseType: 'THESIS',
        status: 'advisor_approved',
        formPayload: JSON.stringify({
          requestDate: '2026-03-13',
          intendedDefenseDate: '2026-03-29',
          additionalNotes: '🔴 ส่งหลัง grace period (LOCKED) - Test Case 6'
        }),
        submittedByStudentId: projects[5].studentId,
        submittedAt: dayjs.tz('2026-03-13 23:59:59', 'Asia/Bangkok').toDate(),
        advisorApprovedAt: dayjs.tz('2026-03-14 01:59:59', 'Asia/Bangkok').toDate()
      });
      console.log('[คพ.03-3] 🔴 LOCKED: ส่งเมื่อ 13/03/2026 (หลัง grace 1 วัน)\n');
    }

    // สร้าง requests
    if (defenseRequests.length > 0) {
      await ProjectDefenseRequest.bulkCreate(defenseRequests, { transaction });
      console.log(`✅ สร้าง ${defenseRequests.length} defense requests สำเร็จ\n`);
    }

    await transaction.commit();

    console.log('======================================================================');
    console.log('📊 SUMMARY:');
    console.log('======================================================================');
    console.log(`✅ Defense Requests: ${defenseRequests.length}`);
    console.log('======================================================================\n');

    console.log('🎉 สร้างข้อมูลทดสอบสำเร็จ!\n');
    console.log('📋 ขั้นตอนต่อไป:');
    console.log('   1. เข้าหน้า /admin/project1/kp02-queue ดูคำร้อง คพ.02');
    console.log('   2. เข้าหน้า /admin/thesis/staff-queue ดูคำร้อง คพ.03');
    console.log('   3. สังเกต deadline tags:');
    console.log('      - ✅ ไม่มี tag = ส่งทันเวลา');
    console.log('      - ⚠️  tag สีเหลือง "ส่งช้า" = ส่งหลัง deadline แต่ยังใน grace period');
    console.log('      - 🔴 tag สีแดง "ส่งหลังหมดเวลา" = ส่งหลัง grace period (เฉพาะที่ lockAfterDeadline = true)\n');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error seeding test cases:', error);
    await sequelize.close();
    process.exit(1);
  }
}

createTestRequests();

