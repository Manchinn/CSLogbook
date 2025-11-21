/**
 * ตรวจสอบ Deadlines ที่มีในระบบ
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { sequelize } = require('../config/database');
const { ImportantDeadline } = require('../models');

async function checkDeadlines() {
  console.log('🔍 ตรวจสอบ Deadlines ที่มีในระบบ...\n');

  try {
    const deadlines = await ImportantDeadline.findAll({
      where: {
        name: [
          'ส่งคำร้องขอสอบ (คพ.02)',
          'ส่งคำร้องขอสอบปริญญานิพนธ์ (คพ.03)',
          'ยื่นคำขอทดสอบระบบ'
        ]
      },
      order: [['name', 'ASC']]
    });

    if (deadlines.length === 0) {
      console.log('❌ ไม่พบ deadline ทั้ง 3 ประเภทในระบบ');
      console.log('\n💡 แนะนำ: รัน seeder เพื่อสร้าง deadline:');
      console.log('   node scripts/seedDeadlineTestCases.js\n');
    } else {
      console.log(`✅ พบ ${deadlines.length}/3 deadlines:\n`);
      
      deadlines.forEach(d => {
        console.log(`📌 ${d.name}`);
        console.log(`   - Academic Year: ${d.academicYear}, Semester: ${d.semester}`);
        console.log(`   - Related To: ${d.relatedTo}`);
        console.log(`   - Deadline: ${d.deadlineAt}`);
        console.log(`   - Grace Period: ${d.gracePeriodMinutes} นาที`);
        console.log(`   - Lock After: ${d.lockAfterDeadline ? 'YES 🔒' : 'NO'}`);
        console.log(`   - Published: ${d.isPublished ? 'YES ✅' : 'NO ❌'}`);
        console.log('');
      });
    }

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await sequelize.close();
    process.exit(1);
  }
}

checkDeadlines();

