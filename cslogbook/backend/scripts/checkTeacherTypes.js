const { User, Teacher } = require('../models');
const { sequelize } = require('../config/database');

async function checkTeacherTypes() {
  try {
    console.log('🔍 ตรวจสอบ Teacher Types ในระบบ...\n');

    // 1. ตรวจสอบ teacher ทั้งหมด
    const teachers = await User.findAll({
      where: { role: 'teacher' },
      include: [{
        model: Teacher,
        as: 'teacher',
        required: true
      }],
      attributes: ['userId', 'username', 'firstName', 'lastName', 'email', 'role']
    });

    console.log(`📊 พบ Teacher ทั้งหมด: ${teachers.length} คน\n`);

    // 2. แยกตาม teacher type
    const academicTeachers = teachers.filter(t => t.teacher?.teacherType === 'academic');
    const supportTeachers = teachers.filter(t => t.teacher?.teacherType === 'support');
    const unknownType = teachers.filter(t => !t.teacher?.teacherType);

    console.log('📋 รายละเอียด Teacher Types:');
    console.log(`   🎓 Academic (อาจารย์สายวิชาการ): ${academicTeachers.length} คน`);
    console.log(`   👨‍💼 Support (เจ้าหน้าที่ภาควิชา): ${supportTeachers.length} คน`);
    console.log(`   ❓ ไม่ระบุ Type: ${unknownType.length} คน\n`);

    // 3. แสดงรายชื่อ Academic Teachers
    if (academicTeachers.length > 0) {
      console.log('🎓 Academic Teachers:');
      academicTeachers.forEach(teacher => {
        console.log(`   - ${teacher.firstName} ${teacher.lastName} (${teacher.username})`);
      });
      console.log('');
    }

    // 4. แสดงรายชื่อ Support Teachers
    if (supportTeachers.length > 0) {
      console.log('👨‍💼 Support Teachers:');
      supportTeachers.forEach(teacher => {
        console.log(`   - ${teacher.firstName} ${teacher.lastName} (${teacher.username})`);
      });
      console.log('');
    }

    // 5. แสดงรายชื่อที่ไม่ระบุ Type
    if (unknownType.length > 0) {
      console.log('❓ Teachers ที่ไม่ระบุ Type:');
      unknownType.forEach(teacher => {
        console.log(`   - ${teacher.firstName} ${teacher.lastName} (${teacher.username})`);
      });
      console.log('');
    }

    // 6. ตรวจสอบ admin ที่เหลือ
    const admins = await User.findAll({
      where: { role: 'admin' },
      attributes: ['userId', 'username', 'firstName', 'lastName', 'email']
    });

    console.log(`👑 Admin ที่เหลือ: ${admins.length} คน`);
    if (admins.length > 0) {
      admins.forEach(admin => {
        console.log(`   - ${admin.firstName} ${admin.lastName} (${admin.username})`);
      });
    }

    console.log('\n✅ การตรวจสอบเสร็จสิ้น');

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  } finally {
    await sequelize.close();
  }
}

// รันสคริปต์
if (require.main === module) {
  checkTeacherTypes();
}

module.exports = { checkTeacherTypes }; 