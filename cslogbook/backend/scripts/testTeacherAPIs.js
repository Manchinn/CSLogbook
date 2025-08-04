const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let academicToken = '';
let supportToken = '';

async function loginTeacher(username, password) {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      username,
      password
    });
    
    if (response.data.success) {
      return response.data.token;
    } else {
      throw new Error('Login failed');
    }
  } catch (error) {
    console.error(`❌ เข้าสู่ระบบ ${username} ไม่สำเร็จ:`, error.response?.data || error.message);
    return null;
  }
}

async function testAcademicTeacher() {
  console.log('\n📚 ทดสอบอาจารย์สายวิชาการ (Academic)...');
  
  // เข้าสู่ระบบ
  academicToken = await loginTeacher('academic_teacher', 'password123');
  if (!academicToken) return;

  console.log('✅ เข้าสู่ระบบสำเร็จ');

  // ทดสอบ API ที่ควรเข้าถึงได้
  const academicTests = [
    {
      name: 'Academic Dashboard',
      url: '/teachers/academic/dashboard',
      method: 'GET'
    },
    {
      name: 'Submit Evaluation',
      url: '/teachers/academic/evaluation',
      method: 'POST',
      data: { studentId: 1, evaluationData: { score: 85 } }
    },
    {
      name: 'Get Documents',
      url: '/teachers/documents',
      method: 'GET'
    }
  ];

  for (const test of academicTests) {
    try {
      const response = await axios({
        method: test.method,
        url: `${BASE_URL}${test.url}`,
        headers: { Authorization: `Bearer ${academicToken}` },
        data: test.data
      });
      console.log(`✅ ${test.name}: สำเร็จ`);
    } catch (error) {
      console.log(`❌ ${test.name}: ล้มเหลว - ${error.response?.status} ${error.response?.data?.message || error.message}`);
    }
  }

  // ทดสอบ API ที่ไม่ควรเข้าถึงได้
  const forbiddenTests = [
    {
      name: 'Support Dashboard (ควรถูกปฏิเสธ)',
      url: '/teachers/support/dashboard',
      method: 'GET'
    },
    {
      name: 'Create Announcement (ควรถูกปฏิเสธ)',
      url: '/teachers/support/announcement',
      method: 'POST',
      data: { title: 'Test', content: 'Test' }
    }
  ];

  for (const test of forbiddenTests) {
    try {
      const response = await axios({
        method: test.method,
        url: `${BASE_URL}${test.url}`,
        headers: { Authorization: `Bearer ${academicToken}` },
        data: test.data
      });
      console.log(`⚠️ ${test.name}: ควรถูกปฏิเสธแต่สำเร็จ (ไม่ถูกต้อง)`);
    } catch (error) {
      if (error.response?.status === 403) {
        console.log(`✅ ${test.name}: ถูกปฏิเสธอย่างถูกต้อง`);
      } else {
        console.log(`❌ ${test.name}: เกิดข้อผิดพลาด - ${error.response?.status} ${error.response?.data?.message || error.message}`);
      }
    }
  }
}

async function testSupportTeacher() {
  console.log('\n👨‍💼 ทดสอบเจ้าหน้าที่ภาควิชา (Support)...');
  
  // เข้าสู่ระบบ
  supportToken = await loginTeacher('support_staff', 'password123');
  if (!supportToken) return;

  console.log('✅ เข้าสู่ระบบสำเร็จ');

  // ทดสอบ API ที่ควรเข้าถึงได้
  const supportTests = [
    {
      name: 'Support Dashboard',
      url: '/teachers/support/dashboard',
      method: 'GET'
    },
    {
      name: 'Create Announcement',
      url: '/teachers/support/announcement',
      method: 'POST',
      data: { title: 'ประกาศทดสอบ', content: 'เนื้อหาประกาศ', targetAudience: 'all' }
    },
    {
      name: 'Get Documents',
      url: '/teachers/documents',
      method: 'GET'
    }
  ];

  for (const test of supportTests) {
    try {
      const response = await axios({
        method: test.method,
        url: `${BASE_URL}${test.url}`,
        headers: { Authorization: `Bearer ${supportToken}` },
        data: test.data
      });
      console.log(`✅ ${test.name}: สำเร็จ`);
    } catch (error) {
      console.log(`❌ ${test.name}: ล้มเหลว - ${error.response?.status} ${error.response?.data?.message || error.message}`);
    }
  }

  // ทดสอบ API ที่ไม่ควรเข้าถึงได้
  const forbiddenTests = [
    {
      name: 'Academic Dashboard (ควรถูกปฏิเสธ)',
      url: '/teachers/academic/dashboard',
      method: 'GET'
    },
    {
      name: 'Submit Evaluation (ควรถูกปฏิเสธ)',
      url: '/teachers/academic/evaluation',
      method: 'POST',
      data: { studentId: 1, evaluationData: { score: 85 } }
    }
  ];

  for (const test of forbiddenTests) {
    try {
      const response = await axios({
        method: test.method,
        url: `${BASE_URL}${test.url}`,
        headers: { Authorization: `Bearer ${supportToken}` },
        data: test.data
      });
      console.log(`⚠️ ${test.name}: ควรถูกปฏิเสธแต่สำเร็จ (ไม่ถูกต้อง)`);
    } catch (error) {
      if (error.response?.status === 403) {
        console.log(`✅ ${test.name}: ถูกปฏิเสธอย่างถูกต้อง`);
      } else {
        console.log(`❌ ${test.name}: เกิดข้อผิดพลาด - ${error.response?.status} ${error.response?.data?.message || error.message}`);
      }
    }
  }
}

async function runTests() {
  console.log('🧪 เริ่มทดสอบ Teacher Types API...\n');
  
  await testAcademicTeacher();
  await testSupportTeacher();
  
  console.log('\n🎉 การทดสอบเสร็จสิ้น!');
}

if (require.main === module) {
  runTests();
}

module.exports = { runTests }; 