const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testSupportStaffRoutes() {
  try {
    console.log('🧪 ทดสอบ Routes สำหรับ Support Staff...\n');

    // ขั้นตอนที่ 1: เข้าสู่ระบบ
    console.log('📋 ขั้นตอนที่ 1: เข้าสู่ระบบ');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'support_staff',
      password: 'password123'
    });

    if (!loginResponse.data.success) {
      console.log('❌ Support Staff Login ล้มเหลว');
      return;
    }

    console.log('✅ Support Staff Login สำเร็จ');
    console.log(`   - Role: ${loginResponse.data.role}`);
    console.log(`   - Teacher Type: ${loginResponse.data.teacherType || 'N/A'}`);

    const token = loginResponse.data.token;

    // ขั้นตอนที่ 2: ทดสอบ Admin Routes
    console.log('\n📋 ขั้นตอนที่ 2: ทดสอบ Admin Routes');

    const adminRoutes = [
      { method: 'GET', path: '/admin/stats', name: 'Admin Stats' },
      { method: 'GET', path: '/admin/students', name: 'Admin Students' },
      { method: 'GET', path: '/admin/teachers', name: 'Admin Teachers' },
      { method: 'GET', path: '/admin/documents', name: 'Admin Documents' },
      { method: 'GET', path: '/admin/curriculums', name: 'Admin Curriculums' },
      { method: 'GET', path: '/admin/academic', name: 'Admin Academic' },
      { method: 'GET', path: '/admin/workflow-steps', name: 'Admin Workflow Steps' },
      { method: 'GET', path: '/admin/notification-settings', name: 'Admin Notification Settings' },
      { method: 'GET', path: '/admin/important-deadlines', name: 'Admin Important Deadlines' }
    ];

    for (const route of adminRoutes) {
      try {
        const response = await axios({
          method: route.method,
          url: `${BASE_URL}${route.path}`,
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`✅ ${route.name}: สำเร็จ (${response.status})`);
      } catch (error) {
        if (error.response?.status === 403) {
          console.log(`❌ ${route.name}: ถูกปฏิเสธ (403) - ควรเข้าถึงได้`);
        } else {
          console.log(`⚠️ ${route.name}: ${error.response?.status} ${error.response?.data?.message || error.message}`);
        }
      }
    }

    // ขั้นตอนที่ 3: ทดสอบ Upload Routes
    console.log('\n📋 ขั้นตอนที่ 3: ทดสอบ Upload Routes');
    try {
      const response = await axios({
        method: 'POST',
        url: `${BASE_URL}/upload/upload-csv`,
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        data: new FormData() // ส่ง FormData ว่างเพื่อทดสอบ
      });
      console.log('✅ Upload CSV: สำเร็จ');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('❌ Upload CSV: ถูกปฏิเสธ (403) - ควรเข้าถึงได้');
      } else {
        console.log(`⚠️ Upload CSV: ${error.response?.status} ${error.response?.data?.message || error.message}`);
      }
    }

    // ขั้นตอนที่ 4: ทดสอบ Student Pairs Routes
    console.log('\n📋 ขั้นตอนที่ 4: ทดสอบ Student Pairs Routes');
    try {
      const response = await axios({
        method: 'GET',
        url: `${BASE_URL}/student-pairs`,
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Student Pairs: สำเร็จ');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('❌ Student Pairs: ถูกปฏิเสธ (403) - ควรเข้าถึงได้');
      } else {
        console.log(`⚠️ Student Pairs: ${error.response?.status} ${error.response?.data?.message || error.message}`);
      }
    }

    // ขั้นตอนที่ 5: ทดสอบ Project Members Routes
    console.log('\n📋 ขั้นตอนที่ 5: ทดสอบ Project Members Routes');
    try {
      const response = await axios({
        method: 'GET',
        url: `${BASE_URL}/project-members`,
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Project Members: สำเร็จ');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('❌ Project Members: ถูกปฏิเสธ (403) - ควรเข้าถึงได้');
      } else {
        console.log(`⚠️ Project Members: ${error.response?.status} ${error.response?.data?.message || error.message}`);
      }
    }

    // ขั้นตอนที่ 6: ทดสอบ Workflow Step Definition Routes
    console.log('\n📋 ขั้นตอนที่ 6: ทดสอบ Workflow Step Definition Routes');
    try {
      const response = await axios({
        method: 'GET',
        url: `${BASE_URL}/workflow-step-definitions`,
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Workflow Step Definitions: สำเร็จ');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('❌ Workflow Step Definitions: ถูกปฏิเสธ (403) - ควรเข้าถึงได้');
      } else {
        console.log(`⚠️ Workflow Step Definitions: ${error.response?.status} ${error.response?.data?.message || error.message}`);
      }
    }

    // ขั้นตอนที่ 7: ทดสอบ Notification Settings Routes
    console.log('\n📋 ขั้นตอนที่ 7: ทดสอบ Notification Settings Routes');
    try {
      const response = await axios({
        method: 'GET',
        url: `${BASE_URL}/notification-settings`,
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Notification Settings: สำเร็จ');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('❌ Notification Settings: ถูกปฏิเสธ (403) - ควรเข้าถึงได้');
      } else {
        console.log(`⚠️ Notification Settings: ${error.response?.status} ${error.response?.data?.message || error.message}`);
      }
    }

    console.log('\n🎉 การทดสอบเสร็จสิ้น!');
    console.log('\n📝 สรุป:');
    console.log('- ✅ Routes ที่แก้ไขแล้วควรเข้าถึงได้');
    console.log('- ❌ Routes ที่ยังไม่ได้แก้ไขจะถูกปฏิเสธ (403)');

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error.message);
  }
}

if (require.main === module) {
  testSupportStaffRoutes();
}

module.exports = { testSupportStaffRoutes };
