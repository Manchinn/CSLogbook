const { User, Teacher } = require('../models');
const { sequelize } = require('../config/database');
const bcrypt = require('bcrypt');

async function createTestTeachers() {
  try {
    console.log('🔧 สร้างข้อมูลทดสอบ Teacher Types...\n');

    // สร้างอาจารย์สายวิชาการ (Academic)
    const academicUser = await User.create({
      username: 'academic_teacher',
      password: await bcrypt.hash('password123', 10),
      email: 'academic@test.com',
      firstName: 'อาจารย์',
      lastName: 'สายวิชาการ',
      role: 'teacher',
      activeStatus: true
    });

    await Teacher.create({
      teacherCode: 'T001',
      userId: academicUser.userId,
      teacherType: 'academic',
      contactExtension: '101'
    });

    console.log('✅ สร้างอาจารย์สายวิชาการสำเร็จ:');
    console.log(`   - Username: academic_teacher`);
    console.log(`   - Password: password123`);
    console.log(`   - Teacher Type: academic\n`);

    // สร้างเจ้าหน้าที่ภาควิชา (Support)
    const supportUser = await User.create({
      username: 'support_staff',
      password: await bcrypt.hash('password123', 10),
      email: 'support@test.com',
      firstName: 'เจ้าหน้าที่',
      lastName: 'ภาควิชา',
      role: 'teacher',
      activeStatus: true
    });

    await Teacher.create({
      teacherCode: 'T002',
      userId: supportUser.userId,
      teacherType: 'support',
      contactExtension: '102'
    });

    console.log('✅ สร้างเจ้าหน้าที่ภาควิชาสำเร็จ:');
    console.log(`   - Username: support_staff`);
    console.log(`   - Password: password123`);
    console.log(`   - Teacher Type: support\n`);

    console.log('🎯 ข้อมูลสำหรับทดสอบ:');
    console.log('📚 อาจารย์สายวิชาการ:');
    console.log('   - เข้าสู่ระบบด้วย: academic_teacher / password123');
    console.log('   - ควรเห็นเมนู: ตรวจสอบเอกสาร, นักศึกษาในที่ปรึกษา, อนุมัติหัวข้อโครงงาน, ประเมินผลการฝึกงาน');
    console.log('');
    console.log('👨‍💼 เจ้าหน้าที่ภาควิชา:');
    console.log('   - เข้าสู่ระบบด้วย: support_staff / password123');
    console.log('   - ควรเห็นเมนู: จัดการผู้ใช้, จัดการเอกสาร, ตั้งค่าระบบ, รายงานสถิติ, ประกาศและแจ้งเตือน');

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  createTestTeachers();
}

module.exports = { createTestTeachers }; 