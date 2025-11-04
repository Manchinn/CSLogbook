/**
 * เพิ่ม Deadlines สำหรับ Semester 2
 */
const path = require('path');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { sequelize } = require('../config/database');
const { ImportantDeadline } = require('../models');

async function addSemester2Deadlines() {
  console.log('🌱 เพิ่ม Deadlines สำหรับ Semester 2...\n');

  const transaction = await sequelize.transaction();

  try {
    // Deadline สำหรับภาค 2/2568
    const deadlines = [
      {
        name: 'ส่งคำร้องขอสอบ (คพ.02)',
        date: '2026-03-15',
        relatedTo: 'project1',
        academicYear: '2568',
        semester: 2,
        isGlobal: true,
        deadlineAt: dayjs.tz('2026-03-15 23:59:59', 'Asia/Bangkok').toDate(),
        timezone: 'Asia/Bangkok',
        description: 'ส่งคำร้องขอสอบโครงงานพิเศษ 1 (คพ.02) - ภาค 2/2568',
        isCritical: true,
        acceptingSubmissions: true,
        allowLate: true,
        lockAfterDeadline: false,
        gracePeriodMinutes: 2880, // 2 วัน
        isPublished: true,
        deadlineType: 'SUBMISSION'
      },
      {
        name: 'ส่งคำร้องขอสอบปริญญานิพนธ์ (คพ.03)',
        date: '2026-03-10',
        relatedTo: 'project2',
        academicYear: '2568',
        semester: 2,
        isGlobal: true,
        deadlineAt: dayjs.tz('2026-03-10 23:59:59', 'Asia/Bangkok').toDate(),
        timezone: 'Asia/Bangkok',
        description: 'ส่งคำร้องขอสอบปริญญานิพนธ์ (คพ.03) - ภาค 2/2568',
        isCritical: true,
        acceptingSubmissions: true,
        allowLate: true,
        lockAfterDeadline: true, // Lock หลังหมดเวลา
        gracePeriodMinutes: 2880, // 2 วัน
        isPublished: true,
        deadlineType: 'SUBMISSION'
      },
      {
        name: 'ยื่นคำขอทดสอบระบบ',
        date: '2026-03-20',
        relatedTo: 'project2',
        academicYear: '2568',
        semester: 2,
        isGlobal: true,
        deadlineAt: dayjs.tz('2026-03-20 23:59:59', 'Asia/Bangkok').toDate(),
        timezone: 'Asia/Bangkok',
        description: 'ยื่นคำขอทดสอบระบบ - ภาค 2/2568',
        isCritical: true,
        acceptingSubmissions: true,
        allowLate: true,
        lockAfterDeadline: false,
        gracePeriodMinutes: 1440, // 1 วัน
        isPublished: true,
        deadlineType: 'SUBMISSION'
      }
    ];

    for (const deadline of deadlines) {
      const [created, wasCreated] = await ImportantDeadline.findOrCreate({
        where: {
          name: deadline.name,
          academicYear: deadline.academicYear,
          semester: deadline.semester
        },
        defaults: deadline,
        transaction
      });

      if (wasCreated) {
        console.log(`✅ สร้าง: ${deadline.name} (${deadline.academicYear}/${deadline.semester})`);
      } else {
        console.log(`ℹ️  มีอยู่แล้ว: ${deadline.name} (${deadline.academicYear}/${deadline.semester})`);
      }
    }

    await transaction.commit();
    console.log('\n🎉 เพิ่ม deadlines สำเร็จ!');
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error:', error);
    await sequelize.close();
    process.exit(1);
  }
}

addSemester2Deadlines();

