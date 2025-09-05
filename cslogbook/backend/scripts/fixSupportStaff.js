const { User, Teacher } = require('../models');
const { sequelize } = require('../config/database');

async function fixSupportStaff() {
  try {
    console.log('🔧 แก้ไขข้อมูล Support Staff...\n');

    // ตรวจสอบ support_staff user
    const supportUser = await User.findOne({
      where: { username: 'support_staff' }
    });

    if (!supportUser) {
      console.log('❌ ไม่พบ Support Staff User');
      return;
    }

    console.log('📋 Support Staff User:');
    console.log(`   - User ID: ${supportUser.userId}`);
    console.log(`   - Username: ${supportUser.username}`);
    console.log(`   - Role: ${supportUser.role}`);

    // ตรวจสอบ teacher record
    const teacher = await Teacher.findOne({ 
      where: { userId: supportUser.userId } 
    });

    if (teacher) {
      console.log('\n📋 Teacher Record ก่อนแก้ไข:');
      console.log(`   - Teacher ID: ${teacher.teacherId}`);
      console.log(`   - Teacher Code: ${teacher.teacherCode}`);
      console.log(`   - Teacher Type: ${teacher.teacherType}`);

      // แก้ไข teacherType เป็น 'support'
      await Teacher.update(
        { teacherType: 'support' },
        { where: { teacherId: teacher.teacherId } }
      );

      console.log('\n✅ แก้ไข Teacher Type เป็น "support" เรียบร้อย');

      // ตรวจสอบผลลัพธ์
      const updatedTeacher = await Teacher.findByPk(teacher.teacherId);
      console.log('\n📋 Teacher Record หลังแก้ไข:');
      console.log(`   - Teacher ID: ${updatedTeacher.teacherId}`);
      console.log(`   - Teacher Code: ${updatedTeacher.teacherCode}`);
      console.log(`   - Teacher Type: ${updatedTeacher.teacherType}`);
    } else {
      console.log('❌ ไม่พบ Teacher Record สำหรับ Support Staff');
    }

    // ตรวจสอบ teachers ทั้งหมด
    console.log('\n📊 ข้อมูล Teachers ทั้งหมดหลังแก้ไข:');
    const allTeachers = await Teacher.findAll({
      include: [{
        model: User,
        as: 'user',
        attributes: ['userId', 'username', 'firstName', 'lastName', 'role']
      }]
    });

    const supportTeachers = allTeachers.filter(t => t.teacherType === 'support');
    const academicTeachers = allTeachers.filter(t => t.teacherType === 'academic');

    console.log(`   Support Teachers: ${supportTeachers.length} คน`);
    supportTeachers.forEach((teacher, index) => {
      console.log(`     ${index + 1}. ${teacher.user.firstName} ${teacher.user.lastName} (${teacher.teacherCode})`);
    });

    console.log(`   Academic Teachers: ${academicTeachers.length} คน`);
    academicTeachers.forEach((teacher, index) => {
      console.log(`     ${index + 1}. ${teacher.user.firstName} ${teacher.user.lastName} (${teacher.teacherCode})`);
    });

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  fixSupportStaff();
}

module.exports = { fixSupportStaff };
