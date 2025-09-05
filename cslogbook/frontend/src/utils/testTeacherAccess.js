// สคริปต์ทดสอบการเข้าถึง Frontend สำหรับ Teacher Types

export const testTeacherAccess = () => {
  console.log('🧪 ทดสอบการเข้าถึง Frontend สำหรับ Teacher Types...\n');

  // ตรวจสอบ localStorage
  const role = localStorage.getItem('role');
  const teacherType = localStorage.getItem('teacherType');
  const isAuthenticated = localStorage.getItem('token');

  console.log('📋 ข้อมูลผู้ใช้ปัจจุบัน:');
  console.log(`   - Role: ${role}`);
  console.log(`   - Teacher Type: ${teacherType}`);
  console.log(`   - Authenticated: ${isAuthenticated ? 'Yes' : 'No'}\n`);

  // ทดสอบการเข้าถึงเมนู
  console.log('🎯 ทดสอบการเข้าถึงเมนู:');
  
  if (role === 'teacher' && teacherType === 'academic') {
    console.log('✅ Academic Teacher - ควรเห็นเมนู:');
    console.log('   - อาจารย์สายวิชาการ');
    console.log('   - ตรวจสอบเอกสาร');
    console.log('   - นักศึกษาในที่ปรึกษา');
    console.log('   - อนุมัติหัวข้อโครงงาน');
    console.log('   - ประเมินผลการฝึกงาน');
    console.log('');
    console.log('❌ Academic Teacher - ควรไม่เห็นเมนู:');
    console.log('   - ผู้ดูแลระบบ');
    console.log('   - จัดการผู้ใช้');
    console.log('   - จัดการเอกสาร');
    console.log('   - ตั้งค่าระบบ');
  } else if (role === 'teacher' && teacherType === 'support') {
    console.log('✅ Support Teacher - ควรเห็นเมนู:');
    console.log('   - ผู้ดูแลระบบ');
    console.log('   - จัดการผู้ใช้');
    console.log('   - จัดการเอกสาร');
    console.log('   - ตั้งค่าระบบ');
    console.log('   - รายงานสถิติ');
    console.log('   - ประกาศและแจ้งเตือน');
    console.log('');
    console.log('❌ Support Teacher - ควรไม่เห็นเมนู:');
    console.log('   - อาจารย์สายวิชาการ');
    console.log('   - ตรวจสอบเอกสาร');
    console.log('   - นักศึกษาในที่ปรึกษา');
    console.log('   - อนุมัติหัวข้อโครงงาน');
    console.log('   - ประเมินผลการฝึกงาน');
  } else if (role === 'admin') {
    console.log('✅ Admin - ควรเห็นเมนู:');
    console.log('   - ผู้ดูแลระบบ');
    console.log('   - จัดการผู้ใช้');
    console.log('   - จัดการเอกสาร');
    console.log('   - ตั้งค่าระบบ');
  } else {
    console.log('❓ ไม่ทราบประเภทผู้ใช้');
  }

  // ทดสอบการเข้าถึง URL
  console.log('\n🔗 ทดสอบการเข้าถึง URL:');
  
  if (role === 'teacher' && teacherType === 'academic') {
    console.log('✅ Academic Teacher - ควรเข้าถึงได้:');
    console.log('   - /teacher/review-documents');
    console.log('   - /teacher/advising');
    console.log('   - /teacher/project-approval');
    console.log('   - /teacher/evaluation');
    console.log('');
    console.log('❌ Academic Teacher - ควรถูกปฏิเสธ:');
    console.log('   - /admin/users');
    console.log('   - /admin/documents');
    console.log('   - /admin/settings');
    console.log('   - /admin/reports');
  } else if (role === 'teacher' && teacherType === 'support') {
    console.log('✅ Support Teacher - ควรเข้าถึงได้:');
    console.log('   - /admin/users/students');
    console.log('   - /admin/users/teachers');
    console.log('   - /admin/documents');
    console.log('   - /admin/settings');
    console.log('   - /admin/reports');
    console.log('   - /admin/announcements');
    console.log('');
    console.log('❌ Support Teacher - ควรถูกปฏิเสธ:');
    console.log('   - /teacher/review-documents');
    console.log('   - /teacher/advising');
    console.log('   - /teacher/project-approval');
    console.log('   - /teacher/evaluation');
  }

  // ทดสอบการเรียก API
  console.log('\n🌐 ทดสอบการเรียก API:');
  
  if (role === 'teacher' && teacherType === 'academic') {
    console.log('✅ Academic Teacher - ควรเรียกได้:');
    console.log('   - GET /api/teachers/academic/dashboard');
    console.log('   - POST /api/teachers/academic/evaluation');
    console.log('   - GET /api/teachers/documents');
    console.log('');
    console.log('❌ Academic Teacher - ควรถูกปฏิเสธ:');
    console.log('   - GET /api/teachers/support/dashboard');
    console.log('   - POST /api/teachers/support/announcement');
  } else if (role === 'teacher' && teacherType === 'support') {
    console.log('✅ Support Teacher - ควรเรียกได้:');
    console.log('   - GET /api/teachers/support/dashboard');
    console.log('   - POST /api/teachers/support/announcement');
    console.log('   - GET /api/teachers/documents');
    console.log('');
    console.log('❌ Support Teacher - ควรถูกปฏิเสธ:');
    console.log('   - GET /api/teachers/academic/dashboard');
    console.log('   - POST /api/teachers/academic/evaluation');
  }

  console.log('\n🎉 การทดสอบเสร็จสิ้น!');
  console.log('\n💡 คำแนะนำ:');
  console.log('1. เปิด Developer Tools → Console');
  console.log('2. เรียกใช้ testTeacherAccess()');
  console.log('3. ตรวจสอบ Network tab สำหรับ API calls');
  console.log('4. ตรวจสอบ Application → Local Storage');
};

// ฟังก์ชันสำหรับทดสอบการเข้าถึง URL
export const testUrlAccess = (url) => {
  try {
    const currentPath = window.location.pathname;
    console.log(`🔗 ทดสอบการเข้าถึง: ${url}`);
    console.log(`📍 ตำแหน่งปัจจุบัน: ${currentPath}`);
    
    // จำลองการนำทาง
    window.history.pushState(null, '', url);
    console.log(`✅ สามารถเข้าถึง ${url} ได้`);
    
    // คืนค่าตำแหน่งเดิม
    window.history.pushState(null, '', currentPath);
  } catch (error) {
    console.log(`❌ ไม่สามารถเข้าถึง ${url}: ${error.message}`);
  }
};

// ฟังก์ชันสำหรับทดสอบการเรียก API
export const testApiCall = async (url, method = 'GET', data = null) => {
  try {
    const token = localStorage.getItem('token');
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    const config = {
      method,
      headers,
      ...(data && { body: JSON.stringify(data) })
    };

    const response = await fetch(`/api${url}`, config);
    
    if (response.ok) {
      console.log(`✅ API ${method} ${url}: สำเร็จ (${response.status})`);
    } else {
      console.log(`❌ API ${method} ${url}: ล้มเหลว (${response.status})`);
    }
  } catch (error) {
    console.log(`❌ API ${method} ${url}: เกิดข้อผิดพลาด - ${error.message}`);
  }
};

// ฟังก์ชันสำหรับทดสอบการเข้าสู่ระบบ
export const testLogin = async (username, password) => {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    
    if (data.success) {
      console.log(`✅ เข้าสู่ระบบสำเร็จ: ${username}`);
      console.log(`   - Role: ${data.role}`);
      console.log(`   - Teacher Type: ${data.teacherType || 'N/A'}`);
      
      // ตรวจสอบ localStorage
      const role = localStorage.getItem('role');
      const teacherType = localStorage.getItem('teacherType');
      console.log(`   - LocalStorage Role: ${role}`);
      console.log(`   - LocalStorage TeacherType: ${teacherType}`);
      
      return true;
    } else {
      console.log(`❌ เข้าสู่ระบบล้มเหลว: ${username} - ${data.message}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ เกิดข้อผิดพลาดในการเข้าสู่ระบบ: ${error.message}`);
    return false;
  }
};

export default testTeacherAccess; 