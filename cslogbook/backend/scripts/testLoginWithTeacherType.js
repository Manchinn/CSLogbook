const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testLoginWithTeacherType() {
  try {
    console.log('🧪 ทดสอบการเข้าสู่ระบบและตรวจสอบ Teacher Type...\n');

    // ทดสอบ login support_staff
    console.log('📋 ทดสอบ Support Staff Login:');
    const supportResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'support_staff',
      password: 'password123'
    });

    if (supportResponse.data.success) {
      console.log('✅ Support Staff Login สำเร็จ');
      console.log(`   - Role: ${supportResponse.data.role}`);
      console.log(`   - Teacher Type: ${supportResponse.data.teacherType || 'N/A'}`);
      console.log(`   - User ID: ${supportResponse.data.userId}`);
      console.log(`   - First Name: ${supportResponse.data.firstName}`);
      console.log(`   - Last Name: ${supportResponse.data.lastName}`);
    } else {
      console.log('❌ Support Staff Login ล้มเหลว');
    }

    console.log('\n📋 ทดสอบ Academic Teacher Login:');
    const academicResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'academic_teacher',
      password: 'password123'
    });

    if (academicResponse.data.success) {
      console.log('✅ Academic Teacher Login สำเร็จ');
      console.log(`   - Role: ${academicResponse.data.role}`);
      console.log(`   - Teacher Type: ${academicResponse.data.teacherType || 'N/A'}`);
      console.log(`   - User ID: ${academicResponse.data.userId}`);
      console.log(`   - First Name: ${academicResponse.data.firstName}`);
      console.log(`   - Last Name: ${academicResponse.data.lastName}`);
    } else {
      console.log('❌ Academic Teacher Login ล้มเหลว');
    }

    // ทดสอบ API calls
    console.log('\n🌐 ทดสอบ API Calls:');

    // Support Staff API calls
    if (supportResponse.data.success) {
      const supportToken = supportResponse.data.token;
      
      try {
        const supportDashboardResponse = await axios.get(`${BASE_URL}/teachers/support/dashboard`, {
          headers: { Authorization: `Bearer ${supportToken}` }
        });
        console.log('✅ Support Dashboard API: สำเร็จ');
      } catch (error) {
        console.log(`❌ Support Dashboard API: ล้มเหลว - ${error.response?.status} ${error.response?.data?.message || error.message}`);
      }

      try {
        const academicDashboardResponse = await axios.get(`${BASE_URL}/teachers/academic/dashboard`, {
          headers: { Authorization: `Bearer ${supportToken}` }
        });
        console.log('⚠️ Academic Dashboard API: ควรถูกปฏิเสธแต่สำเร็จ');
      } catch (error) {
        if (error.response?.status === 403) {
          console.log('✅ Academic Dashboard API: ถูกปฏิเสธอย่างถูกต้อง');
        } else {
          console.log(`❌ Academic Dashboard API: เกิดข้อผิดพลาด - ${error.response?.status} ${error.response?.data?.message || error.message}`);
        }
      }
    }

    // Academic Teacher API calls
    if (academicResponse.data.success) {
      const academicToken = academicResponse.data.token;
      
      try {
        const academicDashboardResponse = await axios.get(`${BASE_URL}/teachers/academic/dashboard`, {
          headers: { Authorization: `Bearer ${academicToken}` }
        });
        console.log('✅ Academic Dashboard API: สำเร็จ');
      } catch (error) {
        console.log(`❌ Academic Dashboard API: ล้มเหลว - ${error.response?.status} ${error.response?.data?.message || error.message}`);
      }

      try {
        const supportDashboardResponse = await axios.get(`${BASE_URL}/teachers/support/dashboard`, {
          headers: { Authorization: `Bearer ${academicToken}` }
        });
        console.log('⚠️ Support Dashboard API: ควรถูกปฏิเสธแต่สำเร็จ');
      } catch (error) {
        if (error.response?.status === 403) {
          console.log('✅ Support Dashboard API: ถูกปฏิเสธอย่างถูกต้อง');
        } else {
          console.log(`❌ Support Dashboard API: เกิดข้อผิดพลาด - ${error.response?.status} ${error.response?.data?.message || error.message}`);
        }
      }
    }

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error.message);
  }
}

if (require.main === module) {
  testLoginWithTeacherType();
}

module.exports = { testLoginWithTeacherType };
