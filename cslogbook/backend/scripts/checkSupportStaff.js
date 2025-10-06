const { User, Teacher } = require('../models');
const { sequelize } = require('../config/database');

async function checkSupportStaff() {
  try {
    console.log('🔍 ตรวจสอบข้อมูล Support Staff...\n');

    // ตรวจสอบ support_staff user
    const supportUser = await User.findOne({
      where: { username: 'support_staff' }
    });

    console.log('📋 Support Staff User:');
    if (supportUser) {
      console.log(`   - User ID: ${supportUser.userId}`);
      console.log(`   - Username: ${supportUser.username}`);
      console.log(`   - Role: ${supportUser.role}`);
      console.log(`   - First Name: ${supportUser.firstName}`);
      console.log(`   - Last Name: ${supportUser.lastName}`);
      console.log(`   - Email: ${supportUser.email}`);
    } else {
      console.log('   ❌ ไม่พบ Support Staff User');
    }

    // ตรวจสอบ teacher record ของ support_staff
    if (supportUser) {
      const teacher = await Teacher.findOne({ 
        where: { userId: supportUser.userId } 
      });
      
      console.log('\n📋 Support Staff Teacher Record:');
      if (teacher) {
        console.log(`   - Teacher ID: ${teacher.teacherId}`);
        console.log(`   - Teacher Code: ${teacher.teacherCode}`);
        console.log(`   - Teacher Type: ${teacher.teacherType}`);
        console.log(`   - Contact Extension: ${teacher.contactExtension}`);
      } else {
        console.log('   ❌ ไม่พบ Teacher Record');
      }
    }

    // ตรวจสอบ teachers ทั้งหมดที่มี teacherType = 'support'
    console.log('\n📊 ข้อมูล Support Teachers ทั้งหมด:');
    const supportTeachers = await Teacher.findAll({
      where: { teacherType: 'support' },
      include: [{
        model: User,
        as: 'user',
        attributes: ['userId', 'username', 'firstName', 'lastName', 'role']
      }]
    });

    console.log(`   พบ Support Teachers ทั้งหมด: ${supportTeachers.length} คน`);
    supportTeachers.forEach((teacher, index) => {
      console.log(`   ${index + 1}. ${teacher.user.firstName} ${teacher.user.lastName} (${teacher.teacherCode}) - Type: ${teacher.teacherType}`);
    });

    // ตรวจสอบ academic teachers
    console.log('\n📊 ข้อมูล Academic Teachers ทั้งหมด:');
    const academicTeachers = await Teacher.findAll({
      where: { teacherType: 'academic' },
      include: [{
        model: User,
        as: 'user',
        attributes: ['userId', 'username', 'firstName', 'lastName', 'role']
      }]
    });

    console.log(`   พบ Academic Teachers ทั้งหมด: ${academicTeachers.length} คน`);
    academicTeachers.forEach((teacher, index) => {
      console.log(`   ${index + 1}. ${teacher.user.firstName} ${teacher.user.lastName} (${teacher.teacherCode}) - Type: ${teacher.teacherType}`);
    });

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  checkSupportStaff();
}

module.exports = { checkSupportStaff };
