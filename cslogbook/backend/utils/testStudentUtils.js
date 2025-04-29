/**
 * ไฟล์สำหรับทดสอบการทำงานของ studentUtils.js
 * รันด้วยคำสั่ง: node utils/testStudentUtils.js
 */

// โหลด environment variables จากไฟล์ .env.development โดยตรง
const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '../.env.development')
});

console.log('กำลังเชื่อมต่อกับฐานข้อมูล: ', {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME
});

// โหลดโมเดลโดยตรงเพื่อทดสอบ
const db = require('../models');
const Curriculum = db.Curriculum;
const Academic = db.Academic;

const { 
  CONSTANTS, 
  calculateStudentYear, 
  isEligibleForInternship,
  isEligibleForProject,
  getCurrentAcademicYear,
  getCurrentSemester
} = require('./studentUtils');

// สร้างฟังก์ชันรอเพื่อให้ค่า constants โหลดจาก database เสร็จสิ้น
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const testStudentUtils = async () => {
  try {
    // รอให้ค่า constants โหลดจาก database เสร็จสิ้น
    await delay(1000);

    console.log('\n---------- ตรวจสอบข้อมูลในฐานข้อมูลโดยตรง ----------');
    
    // ตรวจสอบข้อมูล Academic
    console.log('ค้นหาข้อมูล Academic...');
    const academicData = await Academic.findOne({
      order: [['created_at', 'DESC']]
    });
    
    if (academicData) {
      console.log('พบข้อมูล Academic:');
      console.log('- ID:', academicData.id);
      console.log('- Academic Year:', academicData.academicYear);
      console.log('- Active Curriculum ID:', academicData.activeCurriculumId || academicData.active_curriculum_id);
    } else {
      console.log('ไม่พบข้อมูล Academic');
    }
    
    // ตรวจสอบข้อมูลหลักสูตร
    console.log('\nค้นหาข้อมูลหลักสูตรที่ active...');
    const activeCurriculum = await Curriculum.findOne({
      where: { active: true }
    });
    
    if (activeCurriculum) {
      console.log('พบหลักสูตรที่ active:');
      console.log('- ID:', activeCurriculum.curriculumId || activeCurriculum.curriculum_id);
      console.log('- Name:', activeCurriculum.name);
      console.log('- Credits Info:');
      console.log('  * internshipBaseCredits:', activeCurriculum.internshipBaseCredits || activeCurriculum.internship_base_credits);
      console.log('  * projectBaseCredits:', activeCurriculum.projectBaseCredits || activeCurriculum.project_base_credits);
      console.log('  * projectMajorBaseCredits:', activeCurriculum.projectMajorBaseCredits || activeCurriculum.project_major_base_credits);
    } else {
      console.log('ไม่พบหลักสูตรที่ active');
    }

    // ถ้ามี active_curriculum_id ให้ค้นหาหลักสูตรนั้น
    if (academicData && (academicData.activeCurriculumId || academicData.active_curriculum_id)) {
      const curriculumId = academicData.activeCurriculumId || academicData.active_curriculum_id;
      console.log(`\nค้นหาข้อมูลหลักสูตรตาม ID: ${curriculumId}...`);
      
      const curriculum = await Curriculum.findByPk(curriculumId);
      
      if (curriculum) {
        console.log('พบหลักสูตรตาม ID:');
        console.log('- ID:', curriculum.curriculumId || curriculum.curriculum_id);
        console.log('- Name:', curriculum.name);
        console.log('- Credits Info:');
        console.log('  * internshipBaseCredits:', curriculum.internshipBaseCredits || curriculum.internship_base_credits);
        console.log('  * projectBaseCredits:', curriculum.projectBaseCredits || curriculum.project_base_credits);
        console.log('  * projectMajorBaseCredits:', curriculum.projectMajorBaseCredits || curriculum.project_major_base_credits);
      } else {
        console.log(`ไม่พบหลักสูตร ID: ${curriculumId}`);
      }
    }

    console.log('\n---------- ค่า Constants จากฐานข้อมูล ----------');
    console.log('ค่า constants จากหลักสูตร:');
    console.log('- INTERNSHIP.MIN_TOTAL_CREDITS:', CONSTANTS.INTERNSHIP.MIN_TOTAL_CREDITS);
    console.log('- PROJECT.MIN_TOTAL_CREDITS:', CONSTANTS.PROJECT.MIN_TOTAL_CREDITS);
    console.log('- PROJECT.MIN_MAJOR_CREDITS:', CONSTANTS.PROJECT.MIN_MAJOR_CREDITS);
    
    console.log('\nค่าตัวกำหนดเวลาภาคเรียนจาก Academic:');
    console.log('- ACADEMIC_TERMS.FIRST:', CONSTANTS.ACADEMIC_TERMS.FIRST);
    console.log('- ACADEMIC_TERMS.SECOND:', CONSTANTS.ACADEMIC_TERMS.SECOND);
    console.log('- ACADEMIC_TERMS.SUMMER:', CONSTANTS.ACADEMIC_TERMS.SUMMER);
    
    console.log('\n---------- ทดสอบการทำงานพื้นฐาน ----------');
    const mockStudentCode = '6409710000123'; // ตัวอย่างรหัสนักศึกษาปี 64 (13 หลัก)
    console.log('ตัวอย่างรหัสนักศึกษา:', mockStudentCode);
    
    const yearInfo = calculateStudentYear(mockStudentCode);
    console.log('ข้อมูลชั้นปี:', yearInfo);
    
    const currentAcademicYear = getCurrentAcademicYear();
    console.log('ปีการศึกษาปัจจุบัน:', currentAcademicYear);
    
    const currentSemester = getCurrentSemester();
    console.log('ภาคเรียนปัจจุบัน:', currentSemester);
    
    console.log('\n---------- ทดสอบการตรวจสอบสิทธิ์ฝึกงาน/โครงงาน ----------');
    // ทดสอบกับค่าที่ผ่าน
    console.log('กรณีที่ 1: นักศึกษาปี 3 หน่วยกิตรวม 85 หน่วยกิต (ฝึกงาน)');
    console.log(isEligibleForInternship(3, 85));
    
    // ทดสอบกับค่าที่ไม่ผ่าน
    console.log('กรณีที่ 2: นักศึกษาปี 2 หน่วยกิตรวม 60 หน่วยกิต (ฝึกงาน)');
    console.log(isEligibleForInternship(2, 60));
    
    // ทดสอบกับค่าที่ผ่าน
    console.log('กรณีที่ 3: นักศึกษาปี 4 หน่วยกิตรวม 100 หน่วยกิต หน่วยกิตภาค 60 (โครงงาน)');
    console.log(isEligibleForProject(4, 100, 60));
    
    // ทดสอบกับค่าที่ไม่ผ่าน
    console.log('กรณีที่ 4: นักศึกษาปี 3 หน่วยกิตรวม 90 หน่วยกิต หน่วยกิตภาค 50 (โครงงาน)');
    console.log(isEligibleForProject(3, 90, 50));
    
    console.log('\nการทดสอบเสร็จสิ้น');
    process.exit(0);
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการทดสอบ:', error);
    process.exit(1);
  }
};

// เริ่มทดสอบ
testStudentUtils();