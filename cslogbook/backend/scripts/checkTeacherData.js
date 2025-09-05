const { User, Teacher } = require('../models');
const { sequelize } = require('../config/database');

async function checkTeacherData() {
  try {
    console.log('🔍 ตรวจสอบข้อมูล Teacher ที่มีปัญหา...\n');

    // ตรวจสอบ user ที่มี userId 175
    const user = await User.findByPk(175);
    console.log('📋 User ID 175:');
    if (user) {
      console.log(`   - User ID: ${user.userId}`);
      console.log(`   - Username: ${user.username}`);
      console.log(`   - Role: ${user.role}`);
      console.log(`   - First Name: ${user.firstName}`);
      console.log(`   - Last Name: ${user.lastName}`);
      console.log(`   - Email: ${user.email}`);
    } else {
      console.log('   ❌ ไม่พบ User ID 175');
    }

    // ตรวจสอบ teacher record ที่เกี่ยวข้อง
    if (user) {
      const teacher = await Teacher.findOne({ where: { userId: user.userId } });
      console.log('\n📋 Teacher Record:');
      if (teacher) {
        console.log(`   - Teacher ID: ${teacher.teacherId}`);
        console.log(`   - Teacher Code: ${teacher.teacherCode}`);
        console.log(`   - Teacher Type: ${teacher.teacherType}`);
        console.log(`   - Contact Extension: ${teacher.contactExtension}`);
      } else {
        console.log('   ❌ ไม่พบ Teacher Record');
        console.log('   💡 ปัญหา: User มี role = teacher แต่ไม่มี record ในตาราง teachers');
      }
    }

    // ตรวจสอบ teachers ทั้งหมด
    console.log('\n📊 ข้อมูล Teachers ทั้งหมด:');
    const allTeachers = await Teacher.findAll({
      include: [{
        model: User,
        as: 'user',
        attributes: ['userId', 'username', 'firstName', 'lastName', 'role']
      }]
    });

    console.log(`   พบ Teachers ทั้งหมด: ${allTeachers.length} คน`);
    allTeachers.forEach((teacher, index) => {
      console.log(`   ${index + 1}. ${teacher.user.firstName} ${teacher.user.lastName} (${teacher.teacherCode}) - Type: ${teacher.teacherType}`);
    });

    // ตรวจสอบ users ที่มี role = teacher แต่ไม่มี teacher record
    console.log('\n🔍 ตรวจสอบ Users ที่มี role = teacher แต่ไม่มี teacher record:');
    const teachersWithoutRecord = await User.findAll({
      where: { role: 'teacher' },
      include: [{
        model: Teacher,
        as: 'teacher',
        required: false
      }]
    });

    const orphanedTeachers = teachersWithoutRecord.filter(user => !user.teacher);
    if (orphanedTeachers.length > 0) {
      console.log(`   ❌ พบ ${orphanedTeachers.length} คนที่ไม่มี teacher record:`);
      orphanedTeachers.forEach(user => {
        console.log(`      - ${user.firstName} ${user.lastName} (${user.username}) - User ID: ${user.userId}`);
      });
    } else {
      console.log('   ✅ ทุก teacher user มี teacher record ครบถ้วน');
    }

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  checkTeacherData();
}

module.exports = { checkTeacherData };
