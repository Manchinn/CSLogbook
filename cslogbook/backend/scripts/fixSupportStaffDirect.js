const { sequelize } = require('../config/database');

async function fixSupportStaffDirect() {
  try {
    console.log('🔧 แก้ไขข้อมูล Support Staff โดยตรง...\n');

    // ตรวจสอบข้อมูลปัจจุบัน
    const currentData = await sequelize.query(`
      SELECT u.user_id, u.username, u.role, t.teacher_id, t.teacher_code, t.teacher_type
      FROM users u
      LEFT JOIN teachers t ON u.user_id = t.user_id
      WHERE u.username = 'support_staff'
    `, { type: sequelize.QueryTypes.SELECT });

    console.log('📋 ข้อมูลปัจจุบัน:');
    if (currentData.length > 0) {
      const user = currentData[0];
      console.log(`   - User ID: ${user.user_id}`);
      console.log(`   - Username: ${user.username}`);
      console.log(`   - Role: ${user.role}`);
      console.log(`   - Teacher ID: ${user.teacher_id}`);
      console.log(`   - Teacher Code: ${user.teacher_code}`);
      console.log(`   - Teacher Type: ${user.teacher_type}`);
    } else {
      console.log('   ❌ ไม่พบข้อมูล support_staff');
      return;
    }

    // แก้ไข teacherType เป็น 'support'
    const updateResult = await sequelize.query(`
      UPDATE teachers 
      SET teacher_type = 'support' 
      WHERE user_id = (SELECT user_id FROM users WHERE username = 'support_staff')
    `);

    console.log('\n✅ แก้ไข Teacher Type เป็น "support" เรียบร้อย');

    // ตรวจสอบผลลัพธ์
    const updatedData = await sequelize.query(`
      SELECT u.user_id, u.username, u.role, t.teacher_id, t.teacher_code, t.teacher_type
      FROM users u
      LEFT JOIN teachers t ON u.user_id = t.user_id
      WHERE u.username = 'support_staff'
    `, { type: sequelize.QueryTypes.SELECT });

    console.log('\n📋 ข้อมูลหลังแก้ไข:');
    if (updatedData.length > 0) {
      const user = updatedData[0];
      console.log(`   - User ID: ${user.user_id}`);
      console.log(`   - Username: ${user.username}`);
      console.log(`   - Role: ${user.role}`);
      console.log(`   - Teacher ID: ${user.teacher_id}`);
      console.log(`   - Teacher Code: ${user.teacher_code}`);
      console.log(`   - Teacher Type: ${user.teacher_type}`);
    }

    // ตรวจสอบ teachers ทั้งหมด
    const allTeachers = await sequelize.query(`
      SELECT u.username, u.first_name, u.last_name, t.teacher_code, t.teacher_type
      FROM users u
      LEFT JOIN teachers t ON u.user_id = t.user_id
      WHERE u.role = 'teacher'
      ORDER BY t.teacher_type, u.username
    `, { type: sequelize.QueryTypes.SELECT });

    console.log('\n📊 ข้อมูล Teachers ทั้งหมด:');
    const supportTeachers = allTeachers.filter(t => t.teacher_type === 'support');
    const academicTeachers = allTeachers.filter(t => t.teacher_type === 'academic');

    console.log(`   Support Teachers: ${supportTeachers.length} คน`);
    supportTeachers.forEach((teacher, index) => {
      console.log(`     ${index + 1}. ${teacher.first_name} ${teacher.last_name} (${teacher.teacher_code})`);
    });

    console.log(`   Academic Teachers: ${academicTeachers.length} คน`);
    academicTeachers.forEach((teacher, index) => {
      console.log(`     ${index + 1}. ${teacher.first_name} ${teacher.last_name} (${teacher.teacher_code})`);
    });

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  fixSupportStaffDirect();
}

module.exports = { fixSupportStaffDirect };
