const { sequelize } = require('../config/database');
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testSupportStaffFix() {
  try {
    console.log('🔧 ทดสอบการแก้ไข Support Staff...\n');

    // ขั้นตอนที่ 1: ตรวจสอบข้อมูลปัจจุบัน
    console.log('📋 ขั้นตอนที่ 1: ตรวจสอบข้อมูลปัจจุบัน');
    const currentData = await sequelize.query(`
      SELECT u.user_id, u.username, u.role, t.teacher_id, t.teacher_code, t.teacher_type
      FROM users u
      LEFT JOIN teachers t ON u.user_id = t.user_id
      WHERE u.username = 'support_staff'
    `, { type: sequelize.QueryTypes.SELECT });

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

    // ขั้นตอนที่ 2: แก้ไข teacherType เป็น 'support'
    console.log('\n📋 ขั้นตอนที่ 2: แก้ไข teacherType เป็น "support"');
    const updateResult = await sequelize.query(`
      UPDATE teachers 
      SET teacher_type = 'support' 
      WHERE user_id = (SELECT user_id FROM users WHERE username = 'support_staff')
    `);

    console.log('✅ แก้ไข Teacher Type เป็น "support" เรียบร้อย');

    // ขั้นตอนที่ 3: ตรวจสอบผลลัพธ์
    console.log('\n📋 ขั้นตอนที่ 3: ตรวจสอบผลลัพธ์');
    const updatedData = await sequelize.query(`
      SELECT u.user_id, u.username, u.role, t.teacher_id, t.teacher_code, t.teacher_type
      FROM users u
      LEFT JOIN teachers t ON u.user_id = t.user_id
      WHERE u.username = 'support_staff'
    `, { type: sequelize.QueryTypes.SELECT });

    if (updatedData.length > 0) {
      const user = updatedData[0];
      console.log(`   - User ID: ${user.user_id}`);
      console.log(`   - Username: ${user.username}`);
      console.log(`   - Role: ${user.role}`);
      console.log(`   - Teacher ID: ${user.teacher_id}`);
      console.log(`   - Teacher Code: ${user.teacher_code}`);
      console.log(`   - Teacher Type: ${user.teacher_type}`);
    }

    // ขั้นตอนที่ 4: ทดสอบการเข้าสู่ระบบ
    console.log('\n📋 ขั้นตอนที่ 4: ทดสอบการเข้าสู่ระบบ');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'support_staff',
      password: 'password123'
    });

    if (loginResponse.data.success) {
      console.log('✅ Support Staff Login สำเร็จ');
      console.log(`   - Role: ${loginResponse.data.role}`);
      console.log(`   - Teacher Type: ${loginResponse.data.teacherType || 'N/A'}`);
      console.log(`   - User ID: ${loginResponse.data.userId}`);
      console.log(`   - First Name: ${loginResponse.data.firstName}`);
      console.log(`   - Last Name: ${loginResponse.data.lastName}`);

      // ขั้นตอนที่ 5: ทดสอบ API calls
      console.log('\n📋 ขั้นตอนที่ 5: ทดสอบ API calls');
      const token = loginResponse.data.token;

      try {
        const supportDashboardResponse = await axios.get(`${BASE_URL}/teachers/support/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Support Dashboard API: สำเร็จ');
      } catch (error) {
        console.log(`❌ Support Dashboard API: ล้มเหลว - ${error.response?.status} ${error.response?.data?.message || error.message}`);
      }

      try {
        const academicDashboardResponse = await axios.get(`${BASE_URL}/teachers/academic/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('⚠️ Academic Dashboard API: ควรถูกปฏิเสธแต่สำเร็จ');
      } catch (error) {
        if (error.response?.status === 403) {
          console.log('✅ Academic Dashboard API: ถูกปฏิเสธอย่างถูกต้อง');
        } else {
          console.log(`❌ Academic Dashboard API: เกิดข้อผิดพลาด - ${error.response?.status} ${error.response?.data?.message || error.message}`);
        }
      }
    } else {
      console.log('❌ Support Staff Login ล้มเหลว');
    }

    // ขั้นตอนที่ 6: ตรวจสอบ teachers ทั้งหมด
    console.log('\n📋 ขั้นตอนที่ 6: ตรวจสอบ teachers ทั้งหมด');
    const allTeachers = await sequelize.query(`
      SELECT u.username, u.first_name, u.last_name, t.teacher_code, t.teacher_type
      FROM users u
      LEFT JOIN teachers t ON u.user_id = t.user_id
      WHERE u.role = 'teacher'
      ORDER BY t.teacher_type, u.username
    `, { type: sequelize.QueryTypes.SELECT });

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

    console.log('\n🎉 การทดสอบเสร็จสิ้น!');
    console.log('\n📝 ขั้นตอนต่อไป:');
    console.log('1. รีสตาร์ท backend server');
    console.log('2. เข้าสู่ระบบด้วย support_staff / password123');
    console.log('3. ตรวจสอบเมนูที่แสดงใน sidebar');

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error.message);
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  testSupportStaffFix();
}

module.exports = { testSupportStaffFix };
